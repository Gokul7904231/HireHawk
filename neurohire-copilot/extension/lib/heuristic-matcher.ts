import { ProfileData } from "./profile";
import { TailorOutput } from "./vector-cache";

export const FIELD_PATTERNS: Record<string, RegExp> = {
  first_name: /(first.?name|fname|given.?name)/i,
  last_name: /(last.?name|surname|lname|family.?name)/i,
  full_name: /(^name$|full.?name|your.?name)/i,
  email: /(e-?mail|email)/i,
  phone: /(phone|mobile|contact.?number)/i,
  linkedin: /(linkedin)/i,
  github: /(github|portfolio.?url|website)/i,
  cover_letter: /(cover.?letter|why.*interested|motivation)/i,
  location: /(location|city|address)/i,
  experience_years: /(years.*experience|yoe)/i,
};

export function matchField(input: HTMLInputElement | HTMLTextAreaElement): string | null {
  const labelText = input.labels?.[0]?.textContent || "";
  const placeholder = input.placeholder || "";
  const ariaLabel = input.getAttribute("aria-label") || "";
  const nameAttr = input.name || "";
  const idAttr = input.id || "";

  const haystack = [
    labelText,
    placeholder,
    ariaLabel,
    nameAttr,
    idAttr
  ].filter(Boolean).join(" ").toLowerCase();

  for (const [field, pattern] of Object.entries(FIELD_PATTERNS)) {
    if (pattern.test(haystack)) return field;
  }
  return null;
}

export function resolveFieldValue(field: string, profile: ProfileData, tailorOutput: TailorOutput): string {
  switch (field) {
    case "first_name":
      return profile.name.split(" ")[0] || "";
    case "last_name":
      const parts = profile.name.split(" ");
      return parts.length > 1 ? parts.slice(1).join(" ") : "Kumar"; // default fallback
    case "full_name":
      return profile.name;
    case "email":
      return profile.email;
    case "phone":
      return "+91 98765 43210";
    case "linkedin":
      return "https://linkedin.com/in/gokul-developer";
    case "github":
      return profile.github;
    case "cover_letter":
      return tailorOutput.cover_letter_paragraphs.join("\n\n");
    case "location":
      return "Chennai, India";
    case "experience_years":
      return "2";
    default:
      return "";
  }
}

export function autofillForm(profile: ProfileData, tailorOutput: TailorOutput, doc: Document = document) {
  const inputs = doc.querySelectorAll("input, textarea");
  let filled = 0;
  for (const el of inputs) {
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      const field = matchField(el);
      if (!field) continue;
      const value = resolveFieldValue(field, profile, tailorOutput);
      if (value) {
        el.value = value;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        filled++;
      }
    }
  }
  return { filled, total: inputs.length };
}
