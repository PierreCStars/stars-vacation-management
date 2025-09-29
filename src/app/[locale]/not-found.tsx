import { redirect } from 'next/navigation';

export default function LocaleNotFound() {
  // Redirect to the default locale if an invalid locale is accessed
  redirect('/en/dashboard');
}
