import LocaleEng from "@/locales/lang/en";
import LocaleVie from "@/locales/lang/vi";

export type LocaleResourcesType = {
  [key: string]: {
    [key: string]: string;
  };
};

const Locales = [
  {
    code: "vi",
    name: "Tiếng Việt",
    flag: "🇻🇳",
  },
  {
    code: "en",
    name: "English",
    flag: "🇺🇸",
  },
];

export const LocalesResources = {
  en: LocaleEng,
  vi: LocaleVie,
};

export default Locales;
