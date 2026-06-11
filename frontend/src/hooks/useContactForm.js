import { useState } from "react";
import { contactApi } from "../api/contactApi.js";
import { apiConfig } from "../config/apiConfig.js";
import { showError, showSuccess, showWarning } from "../utils/toast.jsx";

const initialValues = {
  fullName: "",
  email: "",
  phone: "",
  service: "",
  message: "",
};

const validate = (values) => {
  const errors = {};

  if (!values.fullName.trim()) {
    errors.fullName = "Full name is required.";
  }

  if (!/^\S+@\S+\.\S+$/.test(values.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.phone.trim()) {
    errors.phone = "Phone number is required.";
  }

  if (!values.service) {
    errors.service = "Choose a service.";
  }

  if (values.message.trim().length < 10) {
    errors.message = "Message must be at least 10 characters.";
  }

  return errors;
};

export const useContactForm = () => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const updateField = (event) => {
    const { name, value } = event.target;
    setValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: "",
    }));
    setSuccess(false);
    setSubmitError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setSuccess(false);
    setSubmitError("");

    if (Object.keys(nextErrors).length > 0) {
      showWarning("Please fix the highlighted contact form fields.");
      return false;
    }

    setSubmitting(true);

    try {
      if (apiConfig.useApi) {
        await contactApi.submitContact({
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          serviceInterestedIn: values.service,
          message: values.message,
        });
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, 500));
      }

      setSuccess(true);
      setValues(initialValues);
      showSuccess("Message sent successfully.");
      return true;
    } catch (caughtError) {
      setSubmitError(caughtError.message);
      showError(caughtError.message);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    values,
    errors,
    submitting,
    success,
    submitError,
    updateField,
    submit,
  };
};
