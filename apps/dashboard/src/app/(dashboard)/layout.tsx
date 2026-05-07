import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/Sidebar';
import NavigationProgress from '@/components/NavigationProgress';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [{ data: agent }, { count: unreadCount }] = await Promise.all([
    supabase
      .from('agents')
      .select('full_name, email, voice_profile, is_active')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('inbound_messages')
      .select('id', { count: 'exact', head: true })
      .eq('agent_id', user.id)
      .eq('is_read', false),
  ]);

  const pathname = headers().get('x-pathname') ?? '';

  if (!agent?.is_active && !pathname.startsWith('/billing')) {
    redirect('/billing');
  }

  if (agent?.is_active && !agent?.voice_profile && !pathname.startsWith('/onboarding')) {
    redirect('/onboarding');
  }

  const agentName  = agent?.full_name ?? user.email?.split('@')[0] ?? 'Agent';
  const agentEmail = agent?.email ?? user.email ?? '';

  return (
    <div className="flex h-screen overflow-hidden bg-ao-light">
      <NavigationProgress />
      <Sidebar
        agentName={agentName}
        agentEmail={agentEmail}
        unreadInboxCount={unreadCount ?? 0}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
