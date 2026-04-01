import Link from 'next/link';

// ─── Shared primitives ────────────────────────────────────────────────────────

function Check({ className = 'text-indigo-500' }: { className?: string }) {
  return (
    <svg className={`w-5 h-5 shrink-0 ${className}`} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function X({ className = 'text-red-400' }: { className?: string }) {
  return (
    <svg className={`w-5 h-5 shrink-0 ${className}`} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function Partial() {
  return (
    <svg className="w-5 h-5 shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
    </svg>
  );
}

function CTAButton({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <Link
      href="/login"
      className={`inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-base rounded-xl transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/30 hover:-translate-y-0.5 ${className}`}
    >
      {children}
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
      </svg>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="bg-white min-h-screen font-sans antialiased">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">FollowFlow RE</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
              Sign in
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative bg-gray-950 overflow-hidden">
        {/* Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.18),transparent)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_70%_60%,rgba(99,102,241,0.08),transparent)] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-28">
          <div className="max-w-3xl">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              AI-powered · Built for solo California agents
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl font-black text-white leading-[1.08] tracking-tight mb-6">
              Your leads aren't buying{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                from someone else.
              </span>
              <br />
              They're buying from whoever followed up.
            </h1>

            <p className="text-xl text-gray-400 leading-relaxed mb-10 max-w-2xl">
              FollowFlow RE sends AI-written follow-up messages in your voice, automatically,
              so you never lose a lead to silence again — for less than the cost of two lattes a week.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <CTAButton>Start now — $149/month</CTAButton>
              <p className="text-sm text-gray-500">
                30-day money-back guarantee &nbsp;·&nbsp; Cancel anytime
              </p>
            </div>
          </div>

          {/* Hero mockup */}
          <div className="mt-16 max-w-lg">
            <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
              {/* Mockup header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/80">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="text-xs text-gray-400 font-medium">FollowFlow AI · Sending follow-up</span>
                </div>
                <span className="text-xs text-gray-600">Day 3 of 14</span>
              </div>
              {/* Lead info */}
              <div className="px-4 py-3 border-b border-gray-800/60 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-indigo-700 flex items-center justify-center text-white text-xs font-bold">SM</div>
                <div>
                  <div className="text-sm font-medium text-white">Sarah Mitchell</div>
                  <div className="text-xs text-gray-500">Buyer · Pasadena · $750K–$900K</div>
                </div>
              </div>
              {/* Message */}
              <div className="px-4 py-4">
                <div className="bg-indigo-600/90 rounded-xl rounded-tl-sm px-4 py-3 max-w-xs">
                  <p className="text-sm text-white leading-relaxed">
                    Hey Sarah — quick question: are you still targeting Pasadena, or has the search expanded a bit? I have a few things coming up that might be worth a look. — Mike
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-400 text-xs font-medium">✨ AI-generated</span>
                  <span className="px-2 py-0.5 rounded-md bg-gray-800 text-gray-400 text-xs">Via SMS</span>
                  <span className="ml-auto text-xs text-gray-600">Sending now…</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Price shock bar ── */}
      <section className="bg-indigo-600 py-4">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8 text-center sm:text-left">
            <p className="text-indigo-200 text-sm font-medium">
              Ylopo: <span className="text-white font-bold">$295–$695/mo</span>
            </p>
            <span className="hidden sm:block text-indigo-400">·</span>
            <p className="text-indigo-200 text-sm font-medium">
              kvCORE: <span className="text-white font-bold">$499–$1,299/mo</span>
            </p>
            <span className="hidden sm:block text-indigo-400">·</span>
            <p className="text-indigo-200 text-sm font-medium">
              Sierra Interactive: <span className="text-white font-bold">$500+/mo</span>
            </p>
            <span className="hidden sm:block text-indigo-400">·</span>
            <p className="text-white text-sm font-bold">
              FollowFlow RE: <span className="text-2xl font-black">$149</span>/mo
            </p>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-4">
              Everything a solo agent needs.<br />Nothing they don't.
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Five tools, one price. No add-ons, no tiers, no bait-and-switch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className={`rounded-2xl border p-6 ${i === 0 ? 'lg:col-span-2 bg-indigo-50 border-indigo-100' : 'bg-gray-50 border-gray-100'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${i === 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-gray-600 shadow-sm border border-gray-200'}`}>
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-4">Up and running in 10 minutes</h2>
            <p className="text-lg text-gray-500">Three steps. No IT department required.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={i} className="relative text-center">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-7 left-[calc(50%+2rem)] w-full h-px bg-gray-200" />
                )}
                <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white border border-gray-200 shadow-sm mb-5 text-2xl">
                  {step.emoji}
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison table ── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-4">
              You don't need a $600/month platform.<br />You need one that works.
            </h2>
            <p className="text-lg text-gray-500">
              Enterprise CRMs are built for brokerages with marketing teams. You're a solo agent. This was built for you.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-4 font-semibold text-gray-500 w-1/3">Feature</th>
                  <th className="px-6 py-4 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className="text-xs font-semibold text-indigo-600 uppercase tracking-widest">FollowFlow RE</span>
                      <span className="text-2xl font-black text-gray-900 mt-1">$149<span className="text-sm font-normal text-gray-400">/mo</span></span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-gray-400 font-medium">Ylopo</th>
                  <th className="px-6 py-4 text-center text-gray-400 font-medium">kvCORE</th>
                  <th className="px-6 py-4 text-center text-gray-400 font-medium">Follow Up Boss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {COMPARISON.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-6 py-4 font-medium text-gray-700">{row.feature}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">{renderCell(row.followflow)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">{renderCell(row.ylopo)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">{renderCell(row.kvcore)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">{renderCell(row.fub)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 text-center mt-4">
            Competitor pricing is approximate, sourced from publicly available information. Accurate as of early 2026.
          </p>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-24 bg-gray-950">
        <div className="max-w-lg mx-auto px-6 text-center">
          <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4">Pricing</p>
          <h2 className="text-4xl font-black text-white tracking-tight mb-3">One plan. One price.</h2>
          <p className="text-gray-400 mb-12">Everything included. No upgrades. No surprises.</p>

          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 text-left">
            {/* Price */}
            <div className="flex items-end gap-2 mb-2">
              <span className="text-6xl font-black text-white">$149</span>
              <span className="text-gray-400 pb-3 text-lg">/month</span>
            </div>
            <p className="text-gray-500 text-sm mb-8">30-day money-back guarantee. No questions asked. Cancel any time.</p>

            {/* Features list */}
            <ul className="space-y-3 mb-8">
              {PLAN_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="text-indigo-400 mt-0.5" />
                  <span className="text-gray-300 text-sm">{f}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/login"
              className="block w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-base font-bold text-center rounded-xl transition-all"
            >
              Get started — $149/month
            </Link>
            <p className="text-center text-gray-600 text-xs mt-3">30-day money-back guarantee · Cancel anytime · Month-to-month</p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 bg-white border-t border-gray-100">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-black text-gray-900 text-center mb-12">Common questions</h2>
          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <details
                key={i}
                className="group border border-gray-200 rounded-xl overflow-hidden"
              >
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-semibold text-gray-800 text-sm hover:bg-gray-50 transition-colors list-none">
                  {item.q}
                  <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180 shrink-0 ml-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </summary>
                <div className="px-5 pb-5 pt-1 text-sm text-gray-500 leading-relaxed border-t border-gray-100">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 bg-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_120%,rgba(255,255,255,0.07),transparent)] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-5 leading-tight">
            The follow-up you've been<br />meaning to send? It just sent itself.
          </h2>
          <p className="text-indigo-200 text-lg mb-10 max-w-xl mx-auto">
            If FollowFlow doesn't improve your response time in 30 days, you get a full refund. No questions.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-10 py-4 bg-white hover:bg-gray-100 text-indigo-600 font-bold text-base rounded-xl transition-all shadow-xl hover:-translate-y-0.5"
          >
            Get started — $149/month
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <p className="text-indigo-300 text-sm mt-4">30-day money-back guarantee. Cancel anytime.</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-950 py-10 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
              </svg>
            </div>
            <span className="text-gray-400 text-sm font-semibold">FollowFlow RE</span>
          </div>
          <p className="text-gray-600 text-xs">© 2026 FollowFlow RE. All rights reserved.</p>
          <div className="flex items-center gap-5 text-xs text-gray-600">
            <span className="hover:text-gray-400 cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-gray-400 cursor-pointer transition-colors">Terms</span>
            <Link href="/login" className="hover:text-gray-400 transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    title: '14-Day AI Follow-Up Sequences',
    description: 'Automated SMS and email sequences written in your voice. The first text fires within minutes of a new lead. The last message goes out on day 14. You do nothing.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    title: 'Voice-Matched Messaging',
    description: 'Answer 5 quick questions during setup. Every message FollowFlow sends sounds like you wrote it — your sign-off, your tone, your market.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
  },
  {
    title: 'Listing Description Writer',
    description: 'Enter property details, get MLS copy, a social media caption, and a buyer announcement email — all in one click.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
      </svg>
    ),
  },
  {
    title: 'Inbound Reply Dashboard',
    description: 'Every reply from every lead in one place — SMS and email. See who responded, read the full message, and reply directly without switching apps.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
      </svg>
    ),
  },
  {
    title: 'Transaction Milestone Updates',
    description: 'Draft client messages for every California escrow milestone — offer accepted, inspection, appraisal, clear to close, keys. Keep clients calm and confident.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
];

const STEPS = [
  {
    emoji: '📋',
    title: 'Add your leads',
    description: 'Import a CSV or enter leads manually. First follow-up fires automatically within minutes.',
  },
  {
    emoji: '🎙️',
    title: 'Set up your AI voice',
    description: 'Answer 5 quick questions about your style. Done once. Every message sounds authentically like you.',
  },
  {
    emoji: '📲',
    title: 'Let FollowFlow work',
    description: 'AI sends follow-ups on your schedule. You get notified the moment a lead replies.',
  },
];

type CellValue = 'yes' | 'no' | 'partial' | string;

const COMPARISON: {
  feature: string;
  followflow: CellValue;
  ylopo: CellValue;
  kvcore: CellValue;
  fub: CellValue;
}[] = [
  { feature: 'Monthly price',              followflow: '$149',          ylopo: '$295–$695+', kvcore: '$499–$1,299+', fub: '$69–$1,000+' },
  { feature: 'AI-written follow-up',       followflow: 'yes',           ylopo: 'partial',    kvcore: 'partial',      fub: 'no'          },
  { feature: 'Matches your voice',         followflow: 'yes',           ylopo: 'no',         kvcore: 'no',           fub: 'no'          },
  { feature: 'Built for solo agents',      followflow: 'yes',           ylopo: 'no',         kvcore: 'no',           fub: 'partial'     },
  { feature: 'Listing description writer', followflow: 'yes',           ylopo: 'no',         kvcore: 'no',           fub: 'no'          },
  { feature: 'Setup time',                 followflow: '10 minutes',    ylopo: '2–5 days',   kvcore: '1–2 weeks',    fub: '1–3 days'    },
  { feature: 'Annual contract required',   followflow: 'no',            ylopo: 'yes',        kvcore: 'yes',          fub: 'no'          },
  { feature: 'Money-back guarantee',       followflow: '30 days',       ylopo: 'no',         kvcore: 'no',           fub: 'no'          },
];

function renderCell(value: CellValue) {
  if (value === 'yes')     return <Check />;
  if (value === 'no')      return <X />;
  if (value === 'partial') return <Partial />;
  return <span className="text-xs font-semibold text-gray-700 text-center">{value}</span>;
}

const PLAN_FEATURES = [
  'Unlimited leads — no per-seat pricing',
  '14-day automated SMS + email follow-up sequences',
  'AI voice matching (setup once, sounds like you forever)',
  'Listing description writer — MLS, social, and email',
  'Inbound reply dashboard',
  'Transaction milestone message drafts',
  'Lead pipeline dashboard with status tracking',
  'California-specific prompts and escrow language',
];

const FAQ = [
  {
    q: 'Does it actually sound like me, or like a robot?',
    a: 'During setup, you answer 5 short questions about your communication style, a phrase you use often, what sets you apart, your market area, and a sample message. Every AI-written follow-up is personalised to those answers. Agents consistently say the messages read like something they\'d actually send.',
  },
  {
    q: 'What happens when a lead replies?',
    a: 'FollowFlow detects the reply and surfaces it in your inbound dashboard. The automated sequence pauses automatically so you don\'t send another follow-up right after they responded. You take over the conversation from there.',
  },
  {
    q: 'How is this different from Ylopo, kvCORE, or Sierra Interactive?',
    a: 'Those platforms are built for brokerages and teams with marketing staff, a learning curve measured in weeks, and price tags to match. FollowFlow RE is purpose-built for the solo agent. One person, 10-minute setup, $149/month — with AI that matches your voice instead of sending generic blasts.',
  },
  {
    q: 'What\'s the money-back guarantee?',
    a: 'If FollowFlow doesn\'t measurably improve your lead response time within 30 days of signing up, email us for a full refund. No questions, no runaround. We\'re confident in the product — that\'s why we can offer this.',
  },
  {
    q: 'What about Twilio and email costs — are those included?',
    a: 'Twilio SMS and SendGrid email are usage-based services billed at very low per-message rates directly through your own accounts. Most solo agents spend $5–$15/month on message delivery costs. FollowFlow RE walks you through the 5-minute setup during onboarding.',
  },
];
