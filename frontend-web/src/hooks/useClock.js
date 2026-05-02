// src/hooks/useClock.js
import { useState, useEffect } from 'react';
import { getNepaliNow } from '../context/AppContext';

export function useClock() {
  const [nowNP, setNowNP] = useState(getNepaliNow());
  
  useEffect(() => {
    const t = setInterval(() => setNowNP(getNepaliNow()), 1000);
    return () => clearInterval(t);
  }, []);
  
  return nowNP;
}
