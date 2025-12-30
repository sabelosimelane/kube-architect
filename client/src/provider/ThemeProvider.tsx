import { ReactNode } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import useDarkMode from '../hooks/useDarkMode';

const ThemeProvider = ({ children }: { children: ReactNode }) => {

  const { isDarkModeEnabled, toggleDarkModeHandler } = useDarkMode();

  return (
    <ThemeContext.Provider value={{ isDarkModeEnabled, toggleDarkModeHandler }}>
      {children}
    </ThemeContext.Provider>
  )
}

export default ThemeProvider