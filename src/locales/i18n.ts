import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import LanguageDetector from "i18next-browser-languagedetector";
import { LocalesResources } from "./list";

const resources = LocalesResources;
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init(
    {
      resources,
      fallbackLng: "en",
      detection: {
        lookupLocalStorage: "lang",
        lookupQuerystring: "lang",
        order: ["querystring", "localStorage", "navigator"],
      },
      debug: false,

      interpolation: {
        escapeValue: false,
      },
    },
    () => {}
  );
