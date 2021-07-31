import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enAppTranslation from "../locales/en/app.json";
import enGenerateTabTranslation from "../locales/en/generateTab.json";
import enOptionsTranslation from "../locales/en/options.json";

i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        debug: true,
        fallbackLng: "en",
        ns: ["app", "generateTab", "options"],
        resources: {
            en: {
                app: enAppTranslation,
                generateTab: enGenerateTabTranslation,
                options: enOptionsTranslation,
            },
        },
    });

export default i18n;
