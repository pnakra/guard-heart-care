import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PlainLanguageContextType {
  isPlainLanguage: boolean;
  togglePlainLanguage: () => void;
}

const PlainLanguageContext = createContext<PlainLanguageContextType>({
  isPlainLanguage: false,
  togglePlainLanguage: () => {},
});

export function PlainLanguageProvider({ children }: { children: ReactNode }) {
  const [isPlainLanguage, setIsPlainLanguage] = useState(() => {
    return sessionStorage.getItem('gfc_plain_language') === 'true';
  });

  useEffect(() => {
    sessionStorage.setItem('gfc_plain_language', String(isPlainLanguage));
  }, [isPlainLanguage]);

  const togglePlainLanguage = () => setIsPlainLanguage(prev => !prev);

  return (
    <PlainLanguageContext.Provider value={{ isPlainLanguage, togglePlainLanguage }}>
      {children}
    </PlainLanguageContext.Provider>
  );
}

export function usePlainLanguage() {
  return useContext(PlainLanguageContext);
}
