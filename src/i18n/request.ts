import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({locale}) => {
  const safe = ['en','fr','it'].includes(locale || '') ? locale! : 'en';
  const { messages } = await import('@/locales');
  const localeMessages = messages[safe as keyof typeof messages];
  return {
    messages: localeMessages,
    timeZone: 'Europe/Paris'
  };
});
