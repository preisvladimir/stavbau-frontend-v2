import '@testing-library/jest-dom';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import csCommon from '../i18n/cs/common.json';

import enCommon from '../i18n/en/common.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      cs: { common: csCommon },
      en: { common: enCommon },
    },
    lng: 'cs',
    fallbackLng: 'cs',
    ns: ['common'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  });