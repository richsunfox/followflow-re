import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const STYLE_LABELS: Record<string, string> = {
  formal:   'Formal — professional and polished',
  casual:   'Casual — relaxed and conversational',
  friendly: 'Friendly — warm and personable',
};

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: agent } = await supabase
    .from('agents')
    .select('full_name, email, voice_profile, subscription_status, is_active, onboarding_completed')
    .eq('id', user!.id)
    .maybeSingle();

  const vp = agent?.voice_profile as Record<string, string> | null;
  const profileComplete = vp && !vp.skipped;

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account and AI voice profile</p>
      </div>

      <div className="space-y-6">

        {/* ── Account ── */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">Account</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Name</p>
              <p className="text-sm text-gray-900">{agent?.full_name ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email</p>
              <p className="text-sm text-gray-900">{agent?.email ?? user?.email ?? '—'}</p>
            </div>
          </div>
        </section>

        {/* ── AI Voice Profile ── */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">AI Voice Profile</h2>
            <Link
              href="/onboarding"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              {profileComplete ? 'Edit' : 'Set up now →'}
            </Link>
          </div>

          {profileComplete && vp ? (
            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Communication style</p>
                <p className="text-sm text-gray-900">{STYLE_LABELS[vp.communicationStyle] ?? vp.communicationStyle}</p>
              </div>
              {vp.signaturePhrase && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Signature phrase / tone</p>
                  <p className="text-sm text-gray-900">{vp.signaturePhrase}</p>
                </div>
              )}
              {vp.differentiator && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">What sets you apart</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{vp.differentiator}</p>
                </div>
              )}
              {vp.marketArea && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Market area</p>
                  <p className="text-sm text-gray-900">{vp.marketArea}</p>
                </div>
              )}
              {vp.sampleSentence && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Sample message</p>
                  <p className="text-sm text-gray-700 leading-relaxed italic">&ldquo;{vp.sampleSentence}&rdquo;</p>
                </div>
              )}
            </div>
          ) : (
            <div className="px-6 py-8 text-center">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">No voice profile yet</p>
              <p className="text-xs text-gray-400 mb-4">Complete setup so the AI sounds like you</p>
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Set up AI voice
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          )}
        </section>

        {/* ── Plan & Billing ── */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Plan &amp; Billing</h2>
            <Link
              href="/billing"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              Manage →
            </Link>
          </div>
          <div className="px-6 py-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">FollowFlow RE</p>
              <p className="text-xs text-gray-500 mt-0.5">$149 / month · Month-to-month</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
              agent?.is_active
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500'
            }`}>
              {agent?.subscription_status ?? 'pending'}
            </span>
          </div>
        </section>

      </div>
    </div>
  );
}
