import LocaleEng from "@/locales/lang/en";
import LocaleVie from "@/locales/lang/vi";
import LocaleJa from "@/locales/lang/ja";
export type LocaleResourcesType = {
  [key: string]: {
    [key: string]: string;
  };
};

const Locales = [
  {
    code: "en",
    name: "English",
    english: "",
    flag: "🇺🇸",
  },
  {
    code: "vi",
    name: "Tiếng Việt",
    english: "Vietnamese",
    flag: "🇻🇳",
  },
  {
    code: "ja",
    name: "日本語",
    english: "Japanese",
    flag: "🇯🇵",
  },
];

export const LocalesResources = {
  en: LocaleEng,
  vi: LocaleVie,
  ja: LocaleJa,
};

export default Locales;
