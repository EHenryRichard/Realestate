import { useState } from "react";
import { apiConfig } from "../../../config/apiConfig.js";
import { showError, showSuccess, showToast } from "../../../utils/toast.jsx";
import { adminFaqApi } from "../../api/adminFaqApi.js";
import AdminButton from "../ui/AdminButton.jsx";
import AdminInput from "../ui/AdminInput.jsx";
import AdminTextarea from "../ui/AdminTextarea.jsx";

function FaqForm({ initialFaq, mode = "create" }) {
  const [formData, setFormData] = useState({
    question: initialFaq?.question || "",
    answer: initialFaq?.answer || "",
    sortOrder: initialFaq?.sortOrder ?? 0,
    isVisible: initialFaq?.isVisible ?? true,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      question: formData.question,
      answer: formData.answer || null,
      sortOrder: Number(formData.sortOrder || 0),
      isVisible: formData.isVisible,
    };

    if (!apiConfig.useApi) {
      showToast("Looks good. Saving is not ready yet.");
      setMessage("Looks good. Saving is not ready yet.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      if (mode === "edit") {
        await adminFaqApi.update(initialFaq.id, payload);
      } else {
        await adminFaqApi.create(payload);
      }

      const label = mode === "edit" ? "Question updated successfully." : "Question added successfully.";
      setMessage(label);
      showSuccess(label);
    } catch (caughtError) {
      setError(caughtError.message);
      showError(caughtError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <AdminInput
        label="Question"
        name="question"
        onChange={handleChange}
        required
        value={formData.question}
      />
      <AdminTextarea
        label="Answer"
        name="answer"
        onChange={handleChange}
        placeholder="Type your answer here. Leave blank to save the question without an answer yet — it will not appear publicly until answered."
        rows={5}
        value={formData.answer}
      />
      <AdminInput
        label="Sort order"
        min="0"
        name="sortOrder"
        onChange={handleChange}
        type="number"
        value={formData.sortOrder}
      />
      <label className="flex min-h-12 items-center gap-3 border border-brand-forest/10 bg-white px-4 text-sm font-extrabold text-brand-forest">
        <input
          checked={formData.isVisible}
          className="h-4 w-4 accent-brand-forest"
          name="isVisible"
          onChange={handleChange}
          type="checkbox"
        />
        Visible (only shows publicly when answered)
      </label>

      {message ? (
        <div className="border border-brand-gold/35 bg-brand-gold/12 p-4 text-sm font-bold text-brand-forest">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="border border-red-700/25 bg-red-50 p-4 text-sm font-bold text-red-800">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <AdminButton disabled={isSubmitting} type="submit">
          {isSubmitting ? "Saving..." : mode === "edit" ? "Update Question" : "Add Question"}
        </AdminButton>
        <AdminButton to="/admin/faqs" variant="outline">
          Back to Questions
        </AdminButton>
      </div>
    </form>
  );
}

export default FaqForm;
