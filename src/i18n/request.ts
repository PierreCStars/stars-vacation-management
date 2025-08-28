import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({locale}) => {
  const safe = ['en','fr','it'].includes(locale || '') ? locale! : 'en';
  const messages = (await import(`@/locales/${safe}.json`)).default;
  return {
    messages,
    timeZone: 'Europe/Paris'
  };
});
