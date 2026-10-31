import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { translations } from '../i18n';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('vi');
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    let active = true;
    AsyncStorage.getItem('appLanguage')
      .then(saved => { if (active && ['vi', 'en'].includes(saved)) setLanguageState(saved); })
      .catch(error => console.error(error.message))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const setLanguage = async (newLang) => {
    if (newLang !== 'vi' && newLang !== 'en') return;
    try {
      setLanguageState(newLang);
      await AsyncStorage.setItem('appLanguage', newLang);
    } catch (error) {
      console.error('Lỗi khi lưu ngôn ngữ:', error);
    }
  };

  const toggleLanguage = async () => {
    const nextLang = language === 'vi' ? 'en' : 'vi';
    await setLanguage(nextLang);
  };

  // Helper hàm t(key, params)
  const t = useCallback(
    (keyPath, params = {}) => {
      const currentDict = translations[language] || translations.vi;
      const keys = keyPath.split('.');
      let result = currentDict;

      for (const k of keys) {
        if (result && typeof result === 'object' && k in result) {
          result = result[k];
        } else {
          // Fallback to Vietnamese dictionary
          let fallback = translations.vi;
          for (const fbKey of keys) {
            if (fallback && typeof fallback === 'object' && fbKey in fallback) {
              fallback = fallback[fbKey];
            } else {
              fallback = null;
              break;
            }
          }
          result = fallback || keyPath;
          break;
        }
      }

      if (typeof result === 'string' && params && typeof params === 'object') {
        return Object.keys(params).reduce((str, paramKey) => {
          return str.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), params[paramKey]);
        }, result);
      }

      return typeof result === 'string' ? result : keyPath;
    },
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        isVietnamese: language === 'vi',
        isEnglish: language === 'en',
        setLanguage,
        toggleLanguage,
        t,
        loading,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage phải được sử dụng bên trong LanguageProvider');
  }
  return context;
}
