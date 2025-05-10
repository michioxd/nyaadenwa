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
    english: "",
    flag: "🇺🇸",
    author: [
      {
        name: "michioxd",
        github: "https://github.com/michioxd",
      },
    ],
  },
  {
    code: "vi",
    name: "Tiếng Việt",
    english: "Vietnamese",
    flag: "🇻🇳",
    author: [
      {
        name: "michioxd",
        github: "https://github.com/michioxd",
      },
    ],
  },
];

export const LocalesResources = {
  en: LocaleEng,
  vi: LocaleVie,
};

export default Locales;
