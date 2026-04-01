import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/Sidebar';
import NavigationProgress from '@/components/NavigationProgress';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Fetch agent profile
  const { data: agent } = await supabase
    .from('agents')
    .select('full_name, email, voice_profile, is_active')
    .eq('id', user.id)
    .maybeSingle();

  const pathname = headers().get('x-pathname') ?? '';

  // Gate 1: subscription must be active.
  // /billing is exempt so the agent can subscribe without an infinite loop.
  if (!agent?.is_active && !pathname.startsWith('/billing')) {
    redirect('/billing');
  }

  // Gate 2: onboarding must be completed (voice_profile set).
  // /onboarding is exempt.
  if (agent?.is_active && !agent?.voice_profile && !pathname.startsWith('/onboarding')) {
    redirect('/onboarding');
  }

  const agentName  = agent?.full_name ?? user.email?.split('@')[0] ?? 'Agent';
  const agentEmail = agent?.email ?? user.email ?? '';

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <NavigationProgress />
      <Sidebar agentName={agentName} agentEmail={agentEmail} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
