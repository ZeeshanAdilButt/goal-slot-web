import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void, boolean] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isInitialized, setIsInitialized] = useState(false);
  // To prevent hydration mismatch, we don't read usage from localStorage immediately.
  // We use detailed state to track if we've attempted to read from LS.
  // However, simple useState is enough if we use useEffect.

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      
      const item = window.localStorage.getItem(key);
      if (item) {
        // Parse stored json or if none return initialValue
        setStoredValue(JSON.parse(item));
      } else {
        // If not passing generic T, initialValue might need to be cast or handled
      }
      setIsInitialized(true);
    } catch (error) {
      console.log(error);
      setIsInitialized(true);
    }
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue, isInitialized];
}
