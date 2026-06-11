export const formatCurrency = (value, currency = "NGN") => {
  if (typeof value !== "number") {
    return "Price on request";
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
};
