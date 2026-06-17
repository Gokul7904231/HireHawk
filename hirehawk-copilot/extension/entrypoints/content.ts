import { loadProfile } from "../lib/resume-storage";

export default defineContentScript({
  matches: ['*://*.google.com/*'],
  async main() {
    console.log('Hello content.');
    // Before calling /tailor, always load profile from storage (never use fixture data in production)
    const profile = await loadProfile();
  },
});
