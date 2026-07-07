// email_service.rs
// ─────────────────────────────────────────────────────────────────────────────
// Sends transactional email (right now: the "reset your password" link).
// We use the `lettre` crate to talk SMTP to a mail server. The mail server can
// be anything — a self-hosted mailcow, a cPanel/Namecheap mailbox, or a hosted
// provider — because everything is driven by env vars, not hard-coded here.
// ─────────────────────────────────────────────────────────────────────────────

use lettre::{
    AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor,
    message::{Mailbox, MultiPart, SinglePart},
    transport::smtp::authentication::Credentials,
};

use crate::config::AppConfig;

/// A small, cloneable handle we hand to the request handlers so they can send
/// mail. Both fields are `Option` on purpose: if SMTP isn't configured we keep
/// them `None`, the app still boots, and any send attempt fails softly (logged)
/// instead of crashing. `#[derive(Clone)]` lets Actix share one instance across
/// all worker threads cheaply (the SMTP transport is internally reference-counted).
#[derive(Clone)]
pub struct Mailer {
    transport: Option<AsyncSmtpTransport<Tokio1Executor>>, // the live SMTP connection pool
    from: Option<Mailbox>,                                 // the verified "From:" address
}

impl Mailer {
    /// Builds the mailer once at startup from the app config. Every failure path
    /// returns a "disabled" mailer (both fields `None`) rather than panicking, so
    /// a mail misconfiguration can never take the whole API down.
    pub fn from_config(config: &AppConfig) -> Self {
        // No SMTP host => email is intentionally turned off. Warn and carry on.
        let host = config.smtp_host.trim();
        if host.is_empty() {
            tracing::warn!("SMTP_HOST is not set — password reset emails are disabled.");
            return Self {
                transport: None,
                from: None,
            };
        }

        // Parse the "From" once (e.g. `Sureboy Realty <noreply@domain>`). If it's
        // malformed we disable email instead of failing on every send later.
        let from = match format!("{} <{}>", config.mail_from_name, config.mail_from)
            .parse::<Mailbox>()
        {
            Ok(mailbox) => mailbox,
            Err(error) => {
                tracing::error!("Invalid MAIL_FROM '{}': {error}", config.mail_from);
                return Self {
                    transport: None,
                    from: None,
                };
            }
        };

        // Pick the TLS style from the port:
        //   465 = implicit TLS (the whole connection is encrypted from the start)
        //   587/25 = STARTTLS (connect in the clear, then upgrade to TLS)
        let builder = if config.smtp_port == 465 {
            AsyncSmtpTransport::<Tokio1Executor>::relay(host)
        } else {
            AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(host)
        };

        // `.port()` overrides the transport's default port with ours.
        let mut builder = match builder {
            Ok(builder) => builder.port(config.smtp_port),
            Err(error) => {
                tracing::error!("Failed to configure SMTP transport for '{host}': {error}");
                return Self {
                    transport: None,
                    from: None,
                };
            }
        };

        // Attach username/password if provided. Some servers (e.g. a localhost
        // relay) accept unauthenticated mail, so credentials are optional.
        if !config.smtp_username.trim().is_empty() {
            builder = builder.credentials(Credentials::new(
                config.smtp_username.clone(),
                config.smtp_password.clone(),
            ));
        }

        // `.build()` finalises the connection pool. We're fully configured.
        Self {
            transport: Some(builder.build()),
            from: Some(from),
        }
    }

    /// True only when both a transport and a from-address exist — i.e. email is
    /// actually usable. `main.rs` calls this at boot just to log the state.
    pub fn is_enabled(&self) -> bool {
        self.transport.is_some() && self.from.is_some()
    }

    /// Sends the password-reset email. Returns `Err(String)` (not a panic) so the
    /// caller can log the problem and still respond normally to the user.
    pub async fn send_password_reset(
        &self,
        to_email: &str,
        to_name: &str,
        reset_url: &str,
    ) -> Result<(), String> {
        // `let ... else` unpacks both Options at once; if email is disabled we
        // bail out early with a clear message.
        let (Some(transport), Some(from)) = (&self.transport, &self.from) else {
            return Err("Email is not configured (SMTP_HOST missing).".to_string());
        };

        // Build the recipient mailbox. `?` returns early if the address is invalid.
        let to = format!("{to_name} <{to_email}>")
            .parse::<Mailbox>()
            .map_err(|error| format!("Invalid recipient address: {error}"))?;

        // Plain-text body — the fallback for email clients that don't render HTML.
        // (The `\` at line ends is Rust's line-continuation inside a string.)
        let text = format!(
            "Hello {to_name},\n\nWe received a request to reset your Sureboy Realty admin password.\n\
             Open the link below to choose a new password (the link expires shortly):\n\n{reset_url}\n\n\
             If you did not request this, you can safely ignore this email.\n"
        );

        // Nicely styled HTML body with a clickable button (styles are inline
        // because email clients strip <style> blocks).
        let html = format!(
            "<div style=\"font-family:Arial,Helvetica,sans-serif;color:#1f2937;line-height:1.6\">\
               <h2 style=\"color:#0f3d2e;margin:0 0 12px\">Reset your password</h2>\
               <p>Hello {to_name},</p>\
               <p>We received a request to reset your Sureboy Realty admin password. \
               Click the button below to choose a new one. This link expires shortly.</p>\
               <p style=\"margin:24px 0\">\
                 <a href=\"{reset_url}\" style=\"background:#0f3d2e;color:#fff;padding:12px 22px;\
                 text-decoration:none;border-radius:6px;font-weight:bold\">Reset password</a>\
               </p>\
               <p style=\"font-size:13px;color:#6b7280\">Or paste this link into your browser:<br>\
               <a href=\"{reset_url}\">{reset_url}</a></p>\
               <p style=\"font-size:13px;color:#6b7280\">If you didn't request this, you can ignore this email.</p>\
             </div>"
        );

        // Assemble the message. `MultiPart::alternative` ships both bodies and lets
        // the client choose (HTML if it can, plain text otherwise).
        let email = Message::builder()
            .from(from.clone())
            .to(to)
            .subject("Reset your Sureboy Realty admin password")
            .multipart(
                MultiPart::alternative()
                    .singlepart(SinglePart::plain(text))
                    .singlepart(SinglePart::html(html)),
            )
            .map_err(|error| format!("Failed to build email: {error}"))?;

        // Actually hand the message to the SMTP server. `.await` because network
        // I/O is async; `?` converts any send failure into our `Err(String)`.
        transport
            .send(email)
            .await
            .map_err(|error| format!("Failed to send email: {error}"))?;

        Ok(())
    }

    /// Sends the "confirm your email" message a new client gets after signing up.
    /// Same shape as the reset email (plain + HTML, graceful when disabled).
    pub async fn send_email_verification(
        &self,
        to_email: &str,
        to_name: &str,
        verify_url: &str,
    ) -> Result<(), String> {
        let (Some(transport), Some(from)) = (&self.transport, &self.from) else {
            return Err("Email is not configured (SMTP_HOST missing).".to_string());
        };

        let to = format!("{to_name} <{to_email}>")
            .parse::<Mailbox>()
            .map_err(|error| format!("Invalid recipient address: {error}"))?;

        let text = format!(
            "Hello {to_name},\n\nWelcome to Sureboy Realty! Please confirm your email address\n\
             by opening the link below:\n\n{verify_url}\n\n\
             If you didn't create this account, you can ignore this email.\n"
        );

        let html = format!(
            "<div style=\"font-family:Arial,Helvetica,sans-serif;color:#1f2937;line-height:1.6\">\
               <h2 style=\"color:#0f3d2e;margin:0 0 12px\">Confirm your email</h2>\
               <p>Hello {to_name},</p>\
               <p>Welcome to Sureboy Realty! Please confirm your email address to finish\
               setting up your account.</p>\
               <p style=\"margin:24px 0\">\
                 <a href=\"{verify_url}\" style=\"background:#0f3d2e;color:#fff;padding:12px 22px;\
                 text-decoration:none;border-radius:6px;font-weight:bold\">Confirm email</a>\
               </p>\
               <p style=\"font-size:13px;color:#6b7280\">Or paste this link into your browser:<br>\
               <a href=\"{verify_url}\">{verify_url}</a></p>\
               <p style=\"font-size:13px;color:#6b7280\">If you didn't create this account, ignore this email.</p>\
             </div>"
        );

        let email = Message::builder()
            .from(from.clone())
            .to(to)
            .subject("Confirm your Sureboy Realty account")
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

    /// Notifies a client that a new property matches their saved search. Sent (in
    /// the background) when an admin publishes a listing the client opted in for.
    pub async fn send_property_alert(
        &self,
        to_email: &str,
        to_name: &str,
        title: &str,
        location: &str,
        price: &str,
        property_url: &str,
    ) -> Result<(), String> {
        let (Some(transport), Some(from)) = (&self.transport, &self.from) else {
            return Err("Email is not configured (SMTP_HOST missing).".to_string());
        };

        let to = format!("{to_name} <{to_email}>")
            .parse::<Mailbox>()
            .map_err(|error| format!("Invalid recipient address: {error}"))?;

        let text = format!(
            "Hello {to_name},\n\nA new property matching your saved search is now available:\n\n\
             {title}\n{location} — {price}\n\nView it here:\n{property_url}\n\n\
             You're receiving this because you turned on new-listing alerts. You can turn them\n\
             off any time from your dashboard.\n"
        );

        let html = format!(
            "<div style=\"font-family:Arial,Helvetica,sans-serif;color:#1f2937;line-height:1.6\">\
               <h2 style=\"color:#0f3d2e;margin:0 0 12px\">New property for you</h2>\
               <p>Hello {to_name},</p>\
               <p>A new property matching your saved search is now available:</p>\
               <p style=\"font-size:16px;font-weight:bold;color:#0f3d2e;margin:16px 0 4px\">{title}</p>\
               <p style=\"color:#6b7280;margin:0 0 16px\">{location} — {price}</p>\
               <p style=\"margin:20px 0\">\
                 <a href=\"{property_url}\" style=\"background:#0f3d2e;color:#fff;padding:12px 22px;\
                 text-decoration:none;border-radius:6px;font-weight:bold\">View property</a>\
               </p>\
               <p style=\"font-size:13px;color:#6b7280\">You're getting this because you enabled new-listing\
               alerts. Turn them off any time from your dashboard.</p>\
             </div>"
        );

        let email = Message::builder()
            .from(from.clone())
            .to(to)
            .subject(format!("New listing: {title}"))
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
}
