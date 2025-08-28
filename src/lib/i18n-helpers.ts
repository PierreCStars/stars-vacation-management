import { useTranslations } from 'next-intl';

export function useT(ns?: string) {
  const t = useTranslations(ns);
  const tf = (key: string, vars?: Record<string, any>) => {
    try { 
      return t(key as any, vars); 
    } catch { 
      return key; 
    }
  };
  return tf;
}
