export function getLogoUrl(domain: string, token?: string): string {
  if (token) {
    return `https://img.logo.dev/${domain}?token=${token}`;
  }
  // Fallback to logo.dev public or similar keyless fallback
  return `https://img.logo.dev/${domain}`;
}
