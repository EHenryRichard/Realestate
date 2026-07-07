import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { clientAuthApi } from "../../api/clientAuthApi.js";

// Landing page for the "confirm your email" link. It reads ?token=… from the URL
// and calls the verify endpoint once on mount, then shows the outcome.
function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || ""; // the ?token=… from the email link
  const [status, setStatus] = useState("verifying"); // drives which view renders below
  const [message, setMessage] = useState("");
  const ran = useRef(false); // guard against React StrictMode double-invoke (would fire the POST twice)

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!token) {
      setStatus("error");
      setMessage("This link is missing its verification token.");
      return;
    }

    clientAuthApi
      .verifyEmail(token)
      .then((res) => {
        setStatus("success");
        setMessage(res?.message || "Your email has been verified.");
      })
      .catch((error) => {
        setStatus("error");
        setMessage(error.message || "This verification link is invalid or has expired.");
      });
  }, [token]);

  return (
    <main className="mx-auto grid min-h-[60vh] max-w-md place-items-center px-4 py-12 text-center">
      <section className="w-full rounded-xl border border-brand-forest/10 bg-white p-8 shadow-sm">
        {status === "verifying" && (
          <p className="text-brand-muted">Verifying your email…</p>
        )}
        {status === "success" && (
          <>
            <h1 className="font-display text-2xl font-bold text-brand-forest">Email verified 🎉</h1>
            <p className="mt-2 text-sm text-brand-muted">{message}</p>
            <Link
              className="mt-6 inline-block rounded-md bg-brand-forest px-5 py-2.5 font-bold text-white hover:bg-brand-emerald"
              to="/dashboard"
            >
              Go to dashboard
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <h1 className="font-display text-2xl font-bold text-brand-forest">Verification failed</h1>
            <p className="mt-2 text-sm text-red-700">{message}</p>
            <Link
              className="mt-6 inline-block rounded-md border border-brand-forest/20 px-5 py-2.5 font-bold text-brand-forest hover:bg-brand-forest hover:text-white"
              to="/dashboard"
            >
              Back to dashboard
            </Link>
          </>
        )}
      </section>
    </main>
  );
}

export default VerifyEmail;
