// THE mobile number rule (AGENTS.md: one shared function; plan 2.1.2 / 7.7.2). Spaces, dashes,
// brackets, +91 / 91 and a leading 0 are removed; what is left must be 10 digits starting with
// 6, 7, 8 or 9 (Indian mobiles). Stored as +91XXXXXXXXXX. Anything else is null (not a mobile).
const MOBILE = /^[6-9]\d{9}$/;

export function normaliseMobile(raw: string): string | null {
  let digits = raw.replace(/[\s\-().]/g, "");
  if (digits.startsWith("+91")) digits = digits.slice(3);
  else if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return MOBILE.test(digits) ? `+91${digits}` : null;
}

// For screens: "+919876543210" -> "98765 43210".
export function displayMobile(stored: string): string {
  const ten = stored.replace(/^\+91/, "");
  return ten.length === 10 ? `${ten.slice(0, 5)} ${ten.slice(5)}` : stored;
}
