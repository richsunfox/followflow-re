import { redirect } from 'next/navigation';

// Middleware handles auth-aware redirects.
// This just sends the root URL to the leads dashboard.
export default function Home() {
  redirect('/leads');
}
