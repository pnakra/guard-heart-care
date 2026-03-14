import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type AppMode = 'vibe' | 'dev';

interface ModeContextType {
  mode: AppMode;
  isVibe: boolean;
  toggleMode: () => void;
}

const ModeContext = createContext<ModeContextType>({
  mode: 'dev',
  isVibe: false,
  toggleMode: () => {},
});

function getDefaultMode(): AppMode {
  const saved = localStorage.getItem('gfc_mode');
  if (saved === 'vibe' || saved === 'dev') return saved;
  // First-time users (no previous scans) default to vibe
  const hasScannedBefore = sessionStorage.getItem('gfc_has_scanned') === 'true';
  return hasScannedBefore ? 'dev' : 'vibe';
}

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode>(getDefaultMode);

  useEffect(() => {
    localStorage.setItem('gfc_mode', mode);
  }, [mode]);

  // Mark that user has scanned at least once
  useEffect(() => {
    sessionStorage.setItem('gfc_has_scanned', 'true');
  }, []);

  const toggleMode = () => setMode(prev => prev === 'vibe' ? 'dev' : 'vibe');

  return (
    <ModeContext.Provider value={{ mode, isVibe: mode === 'vibe', toggleMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  return useContext(ModeContext);
}
