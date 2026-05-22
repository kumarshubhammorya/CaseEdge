import { useState, useEffect, useRef } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(error);
      return initialValue;
    }
  });

  const valueRef = useRef<T>(storedValue);
  useEffect(() => {
    valueRef.current = storedValue;
  }, [storedValue]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        window.localStorage.setItem(key, JSON.stringify(valueRef.current));
      } catch (error) {
        console.warn(error);
      }
    }, 500); // 500ms debounce
    return () => clearTimeout(timeoutId);
  }, [key, storedValue]);

  useEffect(() => {
    const saveToLocalStorage = () => {
      try {
        window.localStorage.setItem(key, JSON.stringify(valueRef.current));
      } catch (error) {
        console.warn(error);
      }
    };

    window.addEventListener('beforeunload', saveToLocalStorage);

    return () => {
      window.removeEventListener('beforeunload', saveToLocalStorage);
      saveToLocalStorage(); // Synchronously save on unmount
    };
  }, [key]);

  return [storedValue, setStoredValue] as const;
}
