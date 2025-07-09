import { redirect } from 'next/navigation';

export default function AdminPage() {
  // Redirect to the vacation requests admin page
  redirect('/admin/vacation-requests');
}
 