export const formatPhoneNumber = (value = "") => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  return trimmed.replace(/\s+/g, " ");
};
