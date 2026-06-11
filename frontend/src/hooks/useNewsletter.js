import { useState } from "react";
import { newsletterApi } from "../api/newsletterApi.js";
import { apiConfig } from "../config/apiConfig.js";
import { showError, showSuccess, showWarning } from "../utils/toast.jsx";

export const useNewsletter = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setSuccess(false);
    setError("");

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email address.");
      showWarning("Enter a valid email address.");
      return false;
    }

    setSubmitting(true);

    try {
      if (apiConfig.useApi) {
        await newsletterApi.subscribe({ email });
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, 400));
      }

      setSuccess(true);
      setEmail("");
      showSuccess("Newsletter subscription successful.");
      return true;
    } catch (caughtError) {
      setError(caughtError.message);
      showError(caughtError.message);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    email,
    setEmail,
    submitting,
    success,
    error,
    submit,
  };
};
