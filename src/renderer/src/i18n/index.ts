import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en'
import zh from './locales/zh'

const detected = navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en'

void i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
    en: { translation: en }
  },
  lng: detected,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false
})

export default i18n
