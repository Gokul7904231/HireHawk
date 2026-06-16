// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { matchField, resolveFieldValue, autofillForm } from "../lib/heuristic-matcher";
import { getProfile } from "../lib/profile";

describe("Heuristic ATS Naming Natcher", () => {
  it("resolves first_name correctly across different naming conventions", () => {
    // 1. Workday style: name attribute
    const workdayInput = document.createElement("input");
    workdayInput.name = "legalNameSection_firstName";
    expect(matchField(workdayInput)).toBe("first_name");

    // 2. Greenhouse style: aria-label
    const greenhouseInput = document.createElement("input");
    greenhouseInput.setAttribute("aria-label", "First Name");
    expect(matchField(greenhouseInput)).toBe("first_name");

    // 3. Generic style: matching label text content or placeholder
    const genericInput = document.createElement("input");
    genericInput.placeholder = "Enter your first name";
    expect(matchField(genericInput)).toBe("first_name");
  });

  it("resolves correct field values based on candidate profile", () => {
    const mockProfile = getProfile();
    const mockTailor = {
      tailored_bullets: [],
      cover_letter_paragraphs: ["Para 1", "Para 2", "Para 3"],
      cold_email: { subject: "", body: "" },
      referral_message: "",
      claims: [],
      any_unsupported_claims: false
    };

    expect(resolveFieldValue("first_name", mockProfile, mockTailor)).toBe("Gokul");
    expect(resolveFieldValue("email", mockProfile, mockTailor)).toBe("gokul32499@gmail.com");
    expect(resolveFieldValue("cover_letter", mockProfile, mockTailor)).toBe("Para 1\n\nPara 2\n\nPara 3");
  });

  it("autofills forms successfully in JSDOM document", () => {
    const container = document.createElement("div");
    
    const emailInput = document.createElement("input");
    emailInput.id = "email-address";
    container.appendChild(emailInput);

    const letterArea = document.createElement("textarea");
    letterArea.name = "cover_letter";
    container.appendChild(letterArea);

    const mockProfile = getProfile();
    const mockTailor = {
      tailored_bullets: [],
      cover_letter_paragraphs: ["p1", "p2", "p3"],
      cold_email: { subject: "", body: "" },
      referral_message: "",
      claims: [],
      any_unsupported_claims: false
    };

    // Run autofill using container elements
    const inputs = container.querySelectorAll("input, textarea");
    let filled = 0;
    for (const el of inputs) {
      const field = matchField(el as any);
      if (field) {
        const val = resolveFieldValue(field, mockProfile, mockTailor);
        (el as any).value = val;
        filled++;
      }
    }

    expect(filled).toBe(2);
    expect(emailInput.value).toBe("gokul32499@gmail.com");
    expect(letterArea.value).toBe("p1\n\np2\n\np3");
  });
});
