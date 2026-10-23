export type FieldRules = {
  name: string; value: string; required?: boolean; type?: string;
  minLength?: number; maxLength?: number; min?: string | number; max?: string | number;
  integer?: boolean; phone?: boolean; match?: string;
};
export const MAX_STOCK = 2147483647;
export function fieldError(rules: FieldRules): string | undefined {
  const { value } = rules;
  const trimmed = value.trim();
  if (!trimmed) return rules.required ? "This field is required." : undefined;
  if (rules.minLength && trimmed.length < rules.minLength) return rules.type === "password" ? "Use at least 6 characters in your password." : "Enter at least 2 characters.";
  if (rules.maxLength && value.length > rules.maxLength) return "This value is too long.";
  if (rules.type === "email" && !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(trimmed)) return "Enter a valid email address.";
  if (rules.phone && (!/^\+?[0-9 ()-]+$/.test(trimmed) || trimmed.replace(/\D/g, "").length < 7 || trimmed.replace(/\D/g, "").length > 15)) return "Enter a valid phone number with 7 to 15 digits.";
  if (rules.type === "number") {
    const number = Number(value);
    if (!Number.isFinite(number)) return "Enter a valid number.";
    if (rules.integer && !Number.isInteger(number)) return "Enter a whole number.";
    if (rules.min !== undefined && rules.min !== "" && number < Number(rules.min)) return rules.name === "latitude" ? "Latitude must be between -90 and 90." : rules.name === "longitude" ? "Longitude must be between -180 and 180." : rules.name === "quantity" ? "Quantity must be at least 1." : "The value is below the allowed minimum.";
    if (rules.max !== undefined && rules.max !== "" && number > Number(rules.max)) return rules.name === "latitude" ? "Latitude must be between -90 and 90." : rules.name === "longitude" ? "Longitude must be between -180 and 180." : "The value exceeds the allowed maximum.";
  }
  if (rules.match !== undefined && value !== rules.match) return "Passwords do not match.";
  return undefined;
}
