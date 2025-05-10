import LocaleEng from "@/locales/lang/en";
import LocaleVie from "@/locales/lang/vi";

export type LocaleResourcesType = {
  [key: string]: {
    [key: string]: string;
  };
};

const Locales = [
  {
    code: "en",
    name: "English",
    flag: "🇺🇸",
  },
  {
    code: "vi",
    name: "Tiếng Việt",
    flag: "🇻🇳",
  },
];

export const LocalesResources = {
  en: LocaleEng,
  vi: LocaleVie,
};

export default Locales;
