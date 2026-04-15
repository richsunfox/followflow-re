import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/Sidebar';
import NavigationProgress from '@/components/NavigationProgress';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: agent } = await supabase
    .from('agents')
    .select('full_name, email, voice_profile, is_active')
    .eq('id', user.id)
    .maybeSingle();

  // TODO: re-enable billing / onboarding gates before charging agents.
  // if (!agent?.is_active ...) redirect('/billing');
  // if (!agent?.voice_profile ...) redirect('/onboarding');

  const agentName  = agent?.full_name ?? user.email?.split('@')[0] ?? 'Agent';
  const agentEmail = agent?.email ?? user.email ?? '';

  return (
    <div className="flex h-screen overflow-hidden bg-ao-light">
      <NavigationProgress />
      <Sidebar agentName={agentName} agentEmail={agentEmail} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
