export async function injectResumeFile(input: HTMLInputElement, pdfBlob: Blob, filename: string): Promise<void> {
  const file = new File([pdfBlob], filename, { type: "application/pdf" });
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  input.dispatchEvent(new Event("input", { bubbles: true }));
}
