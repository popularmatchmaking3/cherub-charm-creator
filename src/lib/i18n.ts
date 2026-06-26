import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const en = {
  common: {
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    loading: "Loading…",
    back: "Back",
    yes: "Yes",
    no: "No",
    confirm: "Confirm",
    optional: "Optional",
    online: "Online",
    offline: "Offline",
    activeNow: "Active now",
    lastActive: "Last active {{when}}",
  },
  nav: {
    browse: "Browse",
    search: "Search",
    matches: "Matches",
    messages: "Messages",
    membership: "Membership",
    myProfile: "My Profile",
    stories: "Success Stories",
    admin: "Admin",
    signOut: "Sign out",
    settings: "Settings",
    verification: "Verification status",
    support: "Help & Support",
    faq: "FAQ",
    guidelines: "Community guidelines",
    notifications: "Notifications",
  },
  settings: {
    title: "Settings",
    subtitle: "Manage call privacy, language, security, login activity and your account from here.",
    language: "Language",
    languageSub: "Choose how the app is displayed for you.",
    callPrivacy: "Call privacy",
    callPrivacyHeading: "Allow or block calls",
    callPrivacyHelp: "When turned off, matched members will not be able to call you.",
    audioCalls: "Audio calls",
    audioCallsHelp: "Matched members can place voice calls to you.",
    videoCalls: "Video calls",
    videoCallsHelp: "Matched members can place video calls to you.",
    presence: "Online presence",
    presenceHelp: "Let other members see when you were last active. Turn off to stay invisible.",
    showOnline: "Show my online status",
  },
};

const hi = en;

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी (Hindi)" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: { en: { translation: en }, hi: { translation: hi } },
      lng: "en",
      fallbackLng: "en",
      supportedLngs: ["en", "hi"],
      interpolation: { escapeValue: false },
      detection: {
        order: ["localStorage"],
        caches: ["localStorage"],
        lookupLocalStorage: "saathi.lang",
      },
      react: { useSuspense: false },
    });
}

export function changeLanguage(code: LanguageCode) {
  i18n.changeLanguage(code);
  if (typeof document !== "undefined") {
    document.documentElement.lang = code;
  }
}

export default i18n;