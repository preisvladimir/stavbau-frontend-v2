// src/test/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

void i18n
  .use(initReactI18next)
  .init({
    lng: 'cs',
    fallbackLng: 'cs',
    resources: {
      cs: {
        translation: {
          datatable: {
            empty: {
              title: 'Žádná data',
              desc: 'Zkuste upravit filtr nebo přidat novou položku.',
            },
          },
        },
      },
    },
    interpolation: { escapeValue: false },
    // test-friendly
    initImmediate: false,
  });

export default i18n;
