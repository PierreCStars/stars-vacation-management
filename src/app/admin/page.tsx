import { redirect } from 'next/navigation';

// Admin page that redirects to vacation requests management
export default function AdminPage() {
  // Redirect to the vacation requests admin page
  redirect('/admin/vacation-requests');
}
 