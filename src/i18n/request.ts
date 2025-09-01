import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({locale}) => {
  const safe = ['en','fr','it'].includes(locale || '') ? locale! : 'en';
  const { loadMessages } = await import('@/locales');
  const messages = await loadMessages();
  const localeMessages = messages[safe as keyof typeof messages];
  return {
    messages: localeMessages,
    timeZone: 'Europe/Paris'
  };
});
