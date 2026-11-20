export function normalizeMobileNumber(value) {
  return String(value ?? "").replace(/\D/g, "");
}

export function isValidIndianMobileNumber(value) {
  return /^[6-9]\d{9}$/.test(normalizeMobileNumber(value));
}
