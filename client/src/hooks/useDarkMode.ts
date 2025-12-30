import { useEffect, useState } from 'react'

/**
 * @description useDarkMode custom hook to toggle dark mode
 * @returns {isDarkModeEnabled, toggleDarkModeHandler} An object containing the isDarkModeEnabled state, toggleDarkModeHandler function.
 */

const useDarkMode = (): {isDarkModeEnabled: boolean, toggleDarkModeHandler: () => void} => {

   const checkLocalStorage = (): boolean => {
      const isDarkMode = localStorage.getItem('isDarkMode')
      return isDarkMode ? JSON.parse(isDarkMode) : false
   }

   const [isDarkModeEnabled, setIsDarkEnabled] = useState<boolean>(checkLocalStorage())

   const saveToLocalStorage = (): void => {
      localStorage.setItem('isDarkMode', JSON.stringify(isDarkModeEnabled))
   }

   const toggleDarkModeHandler = (): void => {
      setIsDarkEnabled((prev) => !prev)
   }

   useEffect(() => {
      saveToLocalStorage()
   }, [isDarkModeEnabled])

   return { isDarkModeEnabled, toggleDarkModeHandler }
}

export default useDarkMode;
