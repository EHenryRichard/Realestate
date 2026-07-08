// email_service.rs
// ─────────────────────────────────────────────────────────────────────────────
// Sends transactional email (password reset, email verification, new-listing
// alerts) over SMTP via the `lettre` crate. The mail server behind it can be a
// self-hosted docker-mailserver, a cPanel mailbox, or any provider — everything
// here is driven by env vars.
//
// All HTML emails share one branded, table-based layout (`branded_email`) so they
// look consistent and render well in Outlook/Gmail/Apple Mail. The green logo is
// referenced by absolute URL from the public site, so it must be reachable at
// `<PUBLIC_ORIGIN>/images/logo/logogreen.png`.
// ─────────────────────────────────────────────────────────────────────────────

use lettre::{
    AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor,
    message::{Mailbox, MultiPart, SinglePart},
    transport::smtp::authentication::Credentials,
};

use crate::config::AppConfig;

/// Cloneable mail handle shared across Actix workers. `transport`/`from` are
/// `Option` so a missing SMTP config disables email instead of crashing.
#[derive(Clone)]
pub struct Mailer {
    transport: Option<AsyncSmtpTransport<Tokio1Executor>>,
    from: Option<Mailbox>,
    /// Public site origin (e.g. https://sureboyrealty.com) used to build the
    /// absolute logo URL inside emails.
    base_url: String,
}

impl Mailer {
    pub fn from_config(config: &AppConfig) -> Self {
        // Used for the logo URL in every email; no trailing slash.
        let base_url = config.frontend_url.trim_end_matches('/').to_string();

        let host = config.smtp_host.trim();
        if host.is_empty() {
            tracing::warn!("SMTP_HOST is not set — transactional emails are disabled.");
            return Self {
                transport: None,
                from: None,
                base_url,
            };
        }

        let from = match format!("{} <{}>", config.mail_from_name, config.mail_from)
            .parse::<Mailbox>()
        {
            Ok(mailbox) => mailbox,
            Err(error) => {
                tracing::error!("Invalid MAIL_FROM '{}': {error}", config.mail_from);
                return Self {
                    transport: None,
                    from: None,
                    base_url,
                };
            }
        };

        // Port 465 = implicit TLS; anything else negotiates STARTTLS.
        let builder = if config.smtp_port == 465 {
            AsyncSmtpTransport::<Tokio1Executor>::relay(host)
        } else {
            AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(host)
        };
        let mut builder = match builder {
            Ok(builder) => builder.port(config.smtp_port),
            Err(error) => {
                tracing::error!("Failed to configure SMTP transport for '{host}': {error}");
                return Self {
                    transport: None,
                    from: None,
                    base_url,
                };
            }
        };

        if !config.smtp_username.trim().is_empty() {
            builder = builder.credentials(Credentials::new(
                config.smtp_username.clone(),
                config.smtp_password.clone(),
            ));
        }

        Self {
            transport: Some(builder.build()),
            from: Some(from),
            base_url,
        }
    }

    pub fn is_enabled(&self) -> bool {
        self.transport.is_some() && self.from.is_some()
    }

    /// Low-level send: builds a multipart (plain + HTML) message and dispatches it.
    async fn send(
        &self,
        to_email: &str,
        to_name: &str,
        subject: &str,
        text: String,
        html: String,
    ) -> Result<(), String> {
        let (Some(transport), Some(from)) = (&self.transport, &self.from) else {
            return Err("Email is not configured (SMTP_HOST missing).".to_string());
        };

        let to = format!("{to_name} <{to_email}>")
            .parse::<Mailbox>()
            .map_err(|error| format!("Invalid recipient address: {error}"))?;

        let email = Message::builder()
            .from(from.clone())
            .to(to)
            .subject(subject)
            .multipart(
                MultiPart::alternative()
                    .singlepart(SinglePart::plain(text))
                    .singlepart(SinglePart::html(html)),
            )
            .map_err(|error| format!("Failed to build email: {error}"))?;

        transport
            .send(email)
            .await
            .map_err(|error| format!("Failed to send email: {error}"))?;
        Ok(())
    }

    // ─── Public senders ────────────────────────────────────────────────────────

    pub async fn send_password_reset(
        &self,
        to_email: &str,
        to_name: &str,
        reset_url: &str,
    ) -> Result<(), String> {
        let text = format!(
            "Hello {to_name},\n\nWe received a request to reset your Sureboy Realty admin password.\n\
             Open the link below to choose a new password (it expires shortly):\n\n{reset_url}\n\n\
             If you didn't request this, you can safely ignore this email.\n"
        );
        let inner = format!(
            "{heading}{intro}{button}{fallback}{ignore}",
            heading = email_heading("Reset your password"),
            intro = email_paragraph(&format!(
                "Hello {to_name}, we received a request to reset your Sureboy Realty admin \
                 password. Click the button below to choose a new one — the link expires shortly."
            )),
            button = email_button("Reset password", reset_url),
            fallback = email_fallback_link(reset_url),
            ignore = email_muted("If you didn't request this, you can safely ignore this email."),
        );
        self.send(
            to_email,
            to_name,
            "Reset your Sureboy Realty password",
            text,
            branded_email(&self.base_url, &inner),
        )
        .await
    }

    pub async fn send_email_verification(
        &self,
        to_email: &str,
        to_name: &str,
        verify_url: &str,
    ) -> Result<(), String> {
        let text = format!(
            "Hello {to_name},\n\nWelcome to Sureboy Realty! Please confirm your email address\n\
             by opening the link below:\n\n{verify_url}\n\n\
             If you didn't create this account, you can ignore this email.\n"
        );
        let inner = format!(
            "{heading}{intro}{button}{fallback}{ignore}",
            heading = email_heading("Confirm your email"),
            intro = email_paragraph(&format!(
                "Welcome to Sureboy Realty, {to_name}! Please confirm your email address to \
                 finish setting up your account and start saving properties."
            )),
            button = email_button("Confirm email", verify_url),
            fallback = email_fallback_link(verify_url),
            ignore = email_muted("If you didn't create this account, you can ignore this email."),
        );
        self.send(
            to_email,
            to_name,
            "Confirm your Sureboy Realty account",
            text,
            branded_email(&self.base_url, &inner),
        )
        .await
    }

    pub async fn send_property_alert(
        &self,
        to_email: &str,
        to_name: &str,
        title: &str,
        location: &str,
        price: &str,
        property_url: &str,
    ) -> Result<(), String> {
        let text = format!(
            "Hello {to_name},\n\nA new property matching your saved search is now available:\n\n\
             {title}\n{location} — {price}\n\nView it here:\n{property_url}\n\n\
             You're receiving this because you enabled new-listing alerts. Turn them off any time\n\
             from your dashboard.\n"
        );
        // A little property card inside the branded shell.
        let card = format!(
            "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" \
             style=\"margin:8px 0 4px;border:1px solid #e6e9e8;border-radius:10px;\">\
               <tr><td style=\"padding:18px 20px;\">\
                 <p style=\"margin:0;font-size:17px;font-weight:bold;color:#0f3d2e;\">{title}</p>\
                 <p style=\"margin:6px 0 0;font-size:14px;color:#6b7280;\">{location}</p>\
                 <p style=\"margin:10px 0 0;font-size:18px;font-weight:bold;color:#c8a24a;\">{price}</p>\
               </td></tr>\
             </table>"
        );
        let inner = format!(
            "{heading}{intro}{card}{button}{note}",
            heading = email_heading("A new property for you"),
            intro = email_paragraph(&format!(
                "Hello {to_name}, a new listing matching your saved search just went live:"
            )),
            card = card,
            button = email_button("View property", property_url),
            note = email_muted(
                "You're receiving this because you turned on new-listing alerts. \
                 You can turn them off any time from your dashboard.",
            ),
        );
        self.send(
            to_email,
            to_name,
            &format!("New listing: {title}"),
            text,
            branded_email(&self.base_url, &inner),
        )
        .await
    }
}

// ─── Shared HTML building blocks (inline styles only, for email compatibility) ──

/// Wraps inner content in the branded shell: light backdrop, white rounded card,
/// a gold accent bar, the green logo on white, the content, and a footer.
fn branded_email(base_url: &str, inner: &str) -> String {
    let logo = format!("{base_url}/images/logo/logogreen.png");
    format!(
        "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" \
         style=\"background:#eef1f0;margin:0;padding:28px 12px;\">\
          <tr><td align=\"center\">\
            <table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" \
             style=\"width:600px;max-width:100%;background:#ffffff;border-radius:14px;overflow:hidden;\
             box-shadow:0 10px 30px rgba(6,63,44,0.10);font-family:Arial,Helvetica,sans-serif;\">\
              <tr><td style=\"height:5px;background:#c8a24a;line-height:5px;font-size:0;\">&nbsp;</td></tr>\
              <tr><td align=\"center\" style=\"padding:30px 24px 8px;\">\
                <img src=\"{logo}\" alt=\"Sureboy Realty\" width=\"168\" \
                 style=\"display:block;width:168px;max-width:70%;height:auto;\" />\
              </td></tr>\
              <tr><td style=\"padding:16px 36px 8px;color:#374151;line-height:1.6;font-size:15px;\">\
                {inner}\
              </td></tr>\
              <tr><td style=\"padding:22px 36px 30px;\">\
                <hr style=\"border:none;border-top:1px solid #edefee;margin:0 0 16px;\" />\
                <p style=\"margin:0;font-size:12px;color:#9aa4a0;\">\
                  <strong style=\"color:#0f3d2e;\">Sureboy Realty</strong> &nbsp;·&nbsp; \
                  Trusted real estate across Delta &amp; Port Harcourt</p>\
                <p style=\"margin:8px 0 0;font-size:12px;color:#b3bbb7;\">\
                  You received this email because of activity on your Sureboy Realty account.</p>\
              </td></tr>\
            </table>\
          </td></tr>\
        </table>"
    )
}

/// A section heading.
fn email_heading(text: &str) -> String {
    format!(
        "<h1 style=\"margin:0 0 14px;font-size:23px;line-height:1.3;color:#0f3d2e;\">{text}</h1>"
    )
}

/// A normal paragraph.
fn email_paragraph(text: &str) -> String {
    format!("<p style=\"margin:0 0 18px;font-size:15px;color:#374151;\">{text}</p>")
}

/// Small muted note (footer-ish text within the body).
fn email_muted(text: &str) -> String {
    format!("<p style=\"margin:18px 0 0;font-size:13px;color:#9aa4a0;\">{text}</p>")
}

/// A gold pill CTA button (bulletproof-ish table button for Outlook).
fn email_button(label: &str, url: &str) -> String {
    format!(
        "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:6px 0 4px;\">\
           <tr><td style=\"border-radius:9px;background:#0f3d2e;\">\
             <a href=\"{url}\" style=\"display:inline-block;padding:14px 30px;font-size:15px;\
              font-weight:bold;color:#ffffff;text-decoration:none;border-radius:9px;\">{label}</a>\
           </td></tr>\
         </table>"
    )
}

/// The "or paste this link" fallback for when the button can't be clicked.
fn email_fallback_link(url: &str) -> String {
    format!(
        "<p style=\"margin:16px 0 0;font-size:12px;color:#9aa4a0;\">Or paste this link into your \
         browser:<br /><a href=\"{url}\" style=\"color:#c8a24a;word-break:break-all;\">{url}</a></p>"
    )
}
