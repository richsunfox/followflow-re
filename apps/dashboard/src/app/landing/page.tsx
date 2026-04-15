import Link from 'next/link';

// ─── Icon primitives ──────────────────────────────────────────────────────────

function BoltIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}

function BlueCheck() {
  return (
    <div className="w-4 h-4 rounded-full bg-[#3B7BFF]/20 flex items-center justify-center shrink-0 mt-0.5">
      <svg className="w-2.5 h-2.5 text-[#3B7BFF]" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
      </svg>
    </div>
  );
}

function TableCheck() {
  return (
    <div className="flex justify-center">
      <div className="w-7 h-7 rounded-full bg-[#3B7BFF]/15 border border-[#3B7BFF]/25 flex items-center justify-center">
        <svg className="w-3.5 h-3.5 text-[#3B7BFF]" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </div>
    </div>
  );
}

function TableX() {
  return (
    <div className="flex justify-center">
      <div className="w-7 h-7 rounded-full bg-white/[0.04] flex items-center justify-center">
        <svg className="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </div>
    </div>
  );
}

function TablePartial() {
  return (
    <div className="flex justify-center">
      <div className="w-7 h-7 rounded-full bg-amber-400/10 flex items-center justify-center">
        <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
        </svg>
      </div>
    </div>
  );
}

function Star() {
  return (
    <svg className="w-4 h-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="bg-[#0F1629] min-h-screen font-sans antialiased text-white">

      {/* ── Nav ────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0F1629]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 bg-[#3B7BFF] rounded-lg flex items-center justify-center"
              style={{ boxShadow: '0 0 20px rgba(59,123,255,0.45)' }}
            >
              <BoltIcon />
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-none">Always On</div>
              <div className="text-[#3B7BFF] text-[9px] font-bold leading-none mt-[3px] tracking-[0.18em] uppercase">
                The Follow Through System
              </div>
            </div>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors">How it works</a>
            <a href="#pricing" className="text-sm text-slate-400 hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="text-sm text-slate-400 hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-[#3B7BFF] hover:bg-[#2E6AEE] text-white text-sm font-semibold rounded-lg transition-all"
              style={{ boxShadow: '0 0 20px rgba(59,123,255,0.3)' }}
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-24 pb-32">
        {/* Grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(59,123,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(59,123,255,0.035) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
          }}
        />
        {/* Blue glow behind headline */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(59,123,255,0.12) 0%, transparent 65%)' }}
        />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="max-w-4xl">
            {/* Eyebrow badge */}
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#3B7BFF]/25 bg-[#3B7BFF]/[0.08] mb-8"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#3B7BFF] animate-pulse" />
              <span className="text-[#3B7BFF] text-xs font-bold tracking-[0.14em] uppercase">
                AI Follow-Up System for Solo Agents
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-[64px] sm:text-7xl font-black text-white leading-[1.02] tracking-[-0.02em] mb-6">
              Close more deals.<br />
              <span className="text-[#3B7BFF]">Miss zero</span> follow-ups.
            </h1>

            <p className="text-xl text-slate-400 leading-relaxed mb-10 max-w-2xl">
              Always On fires AI-written, voice-matched messages the moment a lead comes in —
              and keeps following up automatically for 14 days. You focus on closing. We handle the rest.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-16">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2.5 px-8 py-4 bg-[#3B7BFF] hover:bg-[#2E6AEE] text-white font-bold text-base rounded-xl transition-all hover:-translate-y-0.5"
                style={{ boxShadow: '0 0 40px rgba(59,123,255,0.4)' }}
              >
                Start for $149 / month
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <p className="text-sm text-slate-500">
                30-day money-back guarantee · Cancel anytime
              </p>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-x-10 gap-y-5">
              {[
                { value: '< 5 min',  label: 'Time to first follow-up' },
                { value: '14 days',  label: 'Automated sequence' },
                { value: '9×',       label: 'Higher conversion rate' },
                { value: '$149/mo',  label: 'Everything included' },
              ].map(s => (
                <div key={s.label} className="flex flex-col">
                  <span className="text-2xl font-black text-white leading-none">{s.value}</span>
                  <span className="text-xs text-slate-500 font-medium mt-1">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Product mockup */}
          <div className="mt-20 max-w-2xl">
            <div
              className="bg-[#0D1525] rounded-2xl border border-white/[0.08] overflow-hidden"
              style={{ boxShadow: '0 0 80px rgba(59,123,255,0.1), 0 40px 80px rgba(0,0,0,0.4)' }}
            >
              {/* Window chrome */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.02]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-white/[0.08]" />
                  <div className="w-3 h-3 rounded-full bg-white/[0.08]" />
                  <div className="w-3 h-3 rounded-full bg-white/[0.08]" />
                </div>
                <div className="flex-1 mx-2">
                  <div className="bg-white/[0.04] rounded-md px-3 py-1 text-[11px] text-slate-600 text-center font-mono max-w-[240px] mx-auto">
                    app.alwayson.ai / leads
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 text-xs font-semibold">Live</span>
                </div>
              </div>

              {/* Lead row */}
              <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#3B7BFF]/20 border border-[#3B7BFF]/25 flex items-center justify-center text-[#3B7BFF] text-xs font-bold shrink-0">
                    SM
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Sarah Mitchell</div>
                    <div className="text-xs text-slate-500">Buyer · Pasadena · $750K–$900K</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-[11px] font-semibold">
                    In Sequence
                  </span>
                  <span className="text-slate-600 text-xs">Day 3 of 14</span>
                </div>
              </div>

              {/* AI message preview */}
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-md bg-[#3B7BFF]/20 flex items-center justify-center">
                    <BoltIcon />
                  </div>
                  <span className="text-xs font-semibold text-[#3B7BFF]">Always On AI</span>
                  <span className="text-xs text-slate-600">· Voice-matched · Day 3 SMS</span>
                  <span className="ml-auto px-2 py-0.5 rounded-md bg-[#3B7BFF]/10 text-[#3B7BFF] text-[10px] font-semibold">
                    Sending now
                  </span>
                </div>

                <div className="bg-[#3B7BFF]/[0.08] border border-[#3B7BFF]/15 rounded-xl rounded-tl-sm px-4 py-3.5">
                  <p className="text-sm text-slate-200 leading-relaxed">
                    Hey Sarah — quick question: are you still focused on Pasadena, or has the search expanded?
                    I have a few things coming up that might be worth a look. — Mike
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.05] text-slate-500 text-[11px]">SMS · via Twilio</span>
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.05] text-slate-500 text-[11px]">✨ AI-generated</span>
                  <span className="ml-auto text-[11px] text-slate-600">11 messages remaining</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social proof strip ─────────────────────────────────────────────── */}
      <div className="border-y border-white/[0.06] bg-white/[0.02] py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-x-12 gap-y-3">
            <span className="text-slate-600 text-xs font-medium uppercase tracking-widest">Agents at</span>
            {['Compass', 'Keller Williams', 'Coldwell Banker', 'Re/Max', 'eXp Realty'].map(b => (
              <span key={b} className="text-slate-500 text-sm font-semibold">{b}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section id="features" className="py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-16">
            <p className="text-[#3B7BFF] text-xs font-bold uppercase tracking-[0.16em] mb-4">The Platform</p>
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4 leading-[1.06]">
              Everything a serious agent needs.<br />Nothing they don't.
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              One price. Five tools. Built specifically for solo agents who can't afford a slow CRM or a missed lead.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className={`rounded-2xl border p-6 transition-all group ${
                  i === 0
                    ? 'lg:col-span-2 border-[#3B7BFF]/25 bg-[#3B7BFF]/[0.06]'
                    : 'border-white/[0.07] bg-white/[0.03] hover:border-white/[0.14] hover:bg-white/[0.05]'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 ${
                    i === 0
                      ? 'bg-[#3B7BFF]/20 text-[#3B7BFF]'
                      : 'bg-white/[0.06] text-slate-400 group-hover:text-slate-200 transition-colors'
                  }`}
                >
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-28 border-y border-white/[0.06] bg-white/[0.015]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-20">
            <p className="text-[#3B7BFF] text-xs font-bold uppercase tracking-[0.16em] mb-4">Setup</p>
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">Up in 10 minutes</h2>
            <p className="text-slate-400 text-lg">Three steps. No IT department. No learning curve.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {STEPS.map((step, i) => (
              <div key={i} className="relative flex flex-col items-center text-center">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-7 left-[calc(50%+3.5rem)] w-[calc(100%-1.5rem)] h-px bg-white/[0.07]" />
                )}
                <div className="relative mb-7">
                  <div
                    className="w-14 h-14 rounded-2xl bg-[#111C35] border border-white/[0.1] flex items-center justify-center text-2xl"
                    style={{ boxShadow: '0 0 30px rgba(59,123,255,0.1)' }}
                  >
                    {step.emoji}
                  </div>
                  <div
                    className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-[#3B7BFF] rounded-full flex items-center justify-center text-white text-xs font-black"
                    style={{ boxShadow: '0 0 12px rgba(59,123,255,0.6)' }}
                  >
                    {i + 1}
                  </div>
                </div>
                <h3 className="font-bold text-white mb-2.5 text-base">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed max-w-xs">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────────────── */}
      <section className="py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[#3B7BFF] text-xs font-bold uppercase tracking-[0.16em] mb-4">From the Field</p>
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              Agents who stopped losing deals<br className="hidden sm:block" /> to slow follow-up
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="bg-[#0D1525] rounded-2xl border border-white/[0.08] p-7 flex flex-col"
              >
                <div className="flex gap-0.5 mb-5">
                  {[...Array(5)].map((_, j) => <Star key={j} />)}
                </div>
                <blockquote className="text-slate-300 text-sm leading-relaxed flex-1 mb-7">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div className="flex items-center gap-3 pt-5 border-t border-white/[0.06]">
                  <div className="w-9 h-9 rounded-full bg-[#3B7BFF]/20 border border-[#3B7BFF]/25 flex items-center justify-center text-[#3B7BFF] text-sm font-bold shrink-0">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-white text-sm font-semibold">{t.name}</div>
                    <div className="text-slate-500 text-xs">{t.title}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison ─────────────────────────────────────────────────────── */}
      <section className="py-28 border-y border-white/[0.06] bg-white/[0.015]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-[#3B7BFF] text-xs font-bold uppercase tracking-[0.16em] mb-4">Comparison</p>
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4 leading-[1.06]">
              Built for solo agents.<br />Priced like it.
            </h2>
            <p className="text-slate-400 text-lg">
              Enterprise CRMs are built for brokerages with marketing teams and six-figure IT budgets.
              You need one tool that actually works.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.03]">
                  <th className="text-left px-6 py-5 font-semibold text-slate-500 w-1/3">Feature</th>
                  <th className="px-6 py-5 text-center bg-[#3B7BFF]/[0.06]">
                    <div className="inline-flex flex-col items-center gap-1.5">
                      <span className="text-[10px] font-bold text-[#3B7BFF] uppercase tracking-[0.18em]">Always On</span>
                      <span className="text-2xl font-black text-white">
                        $149<span className="text-sm font-normal text-slate-500">/mo</span>
                      </span>
                    </div>
                  </th>
                  <th className="px-6 py-5 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">Ylopo</th>
                  <th className="px-6 py-5 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">kvCORE</th>
                  <th className="px-6 py-5 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">Follow Up Boss</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr
                    key={i}
                    className={`border-b border-white/[0.05] ${i % 2 === 1 ? 'bg-white/[0.015]' : ''}`}
                  >
                    <td className="px-6 py-4 font-medium text-slate-300">{row.feature}</td>
                    <td className="px-6 py-4 bg-[#3B7BFF]/[0.04]">{renderCompCell(row.alwayson)}</td>
                    <td className="px-6 py-4">{renderCompCell(row.ylopo)}</td>
                    <td className="px-6 py-4">{renderCompCell(row.kvcore)}</td>
                    <td className="px-6 py-4">{renderCompCell(row.fub)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-600 text-center mt-4">
            Competitor pricing approximate, sourced from publicly available information. Accurate as of early 2026.
          </p>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-28">
        <div className="max-w-lg mx-auto px-6 text-center">
          <p className="text-[#3B7BFF] text-xs font-bold uppercase tracking-[0.16em] mb-4">Pricing</p>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-3">One plan. One price.</h2>
          <p className="text-slate-400 mb-12 text-lg">Everything included. No tiers. No surprises.</p>

          <div
            className="bg-[#0D1525] rounded-2xl border border-[#3B7BFF]/20 p-8 text-left"
            style={{ boxShadow: '0 0 60px rgba(59,123,255,0.1)' }}
          >
            {/* Price */}
            <div className="flex items-end gap-2 mb-1">
              <span className="text-6xl font-black text-white tracking-tight">$149</span>
              <span className="text-slate-400 pb-3 text-lg">/month</span>
            </div>
            <p className="text-slate-500 text-sm mb-8">
              30-day money-back guarantee. No questions asked. Cancel any time.
            </p>

            {/* Features list */}
            <ul className="space-y-3 mb-8">
              {PLAN_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-3">
                  <BlueCheck />
                  <span className="text-slate-300 text-sm leading-relaxed">{f}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              className="flex items-center justify-center gap-2.5 w-full py-4 bg-[#3B7BFF] hover:bg-[#2E6AEE] text-white text-base font-bold rounded-xl transition-all hover:-translate-y-0.5"
              style={{ boxShadow: '0 0 30px rgba(59,123,255,0.35)' }}
            >
              Get started now
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <p className="text-center text-slate-600 text-xs mt-3">
              30-day money-back guarantee · Cancel anytime · Month-to-month
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-28 border-t border-white/[0.06] bg-white/[0.015]">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[#3B7BFF] text-xs font-bold uppercase tracking-[0.16em] mb-4">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Common questions</h2>
          </div>
          <div className="space-y-2">
            {FAQ.map((item, i) => (
              <details
                key={i}
                className="group bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden hover:border-white/[0.13] transition-colors"
              >
                <summary className="flex items-center justify-between px-6 py-4.5 cursor-pointer font-semibold text-white text-sm list-none select-none py-[18px]">
                  {item.q}
                  <svg
                    className="w-4 h-4 text-slate-500 transition-transform duration-200 group-open:rotate-180 shrink-0 ml-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </summary>
                <div className="px-6 pb-5 pt-1 text-sm text-slate-400 leading-relaxed border-t border-white/[0.06]">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────────── */}
      <section className="py-32 relative overflow-hidden border-t border-white/[0.06]">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(59,123,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(59,123,255,0.025) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(59,123,255,0.1) 0%, transparent 65%)' }}
        />

        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#3B7BFF]/25 bg-[#3B7BFF]/[0.08] mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3B7BFF] animate-pulse" />
            <span className="text-[#3B7BFF] text-xs font-bold tracking-[0.14em] uppercase">30-day money-back guarantee</span>
          </div>

          <h2 className="text-5xl sm:text-6xl font-black text-white tracking-tight mb-5 leading-[1.04]">
            Always On.<br />
            <span className="text-[#3B7BFF]">Always following up.</span>
          </h2>
          <p className="text-slate-400 text-xl mb-10 max-w-xl mx-auto leading-relaxed">
            If Always On doesn&apos;t measurably improve your lead response time within 30 days,
            you get a full refund. No questions. No runaround.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-3 px-10 py-5 bg-[#3B7BFF] hover:bg-[#2E6AEE] text-white font-black text-lg rounded-xl transition-all hover:-translate-y-1"
            style={{ boxShadow: '0 0 60px rgba(59,123,255,0.45)' }}
          >
            Get started — $149/month
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <p className="text-slate-600 text-sm mt-5">Cancel anytime · Month-to-month · No contracts</p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-10 bg-[#0A1020]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-[#3B7BFF] rounded-md flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <div>
              <div className="text-white text-sm font-bold leading-none">Always On</div>
              <div className="text-[#3B7BFF] text-[9px] font-bold leading-none mt-[3px] tracking-[0.18em] uppercase">
                The Follow Through System
              </div>
            </div>
          </div>
          <p className="text-slate-600 text-xs">© 2026 Always On. All rights reserved.</p>
          <div className="flex items-center gap-6 text-xs text-slate-600">
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Terms</span>
            <Link href="/login" className="hover:text-slate-400 transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

function renderCompCell(value: string) {
  if (value === 'yes')     return <TableCheck />;
  if (value === 'no')      return <TableX />;
  if (value === 'partial') return <TablePartial />;
  return <span className="text-xs font-semibold text-slate-400 block text-center">{value}</span>;
}

const FEATURES = [
  {
    title: '14-Day AI Follow-Up Sequences',
    description:
      'Automated SMS and email sequences written in your voice. The first message fires within minutes of a new lead. The last goes out on day 14. You do nothing.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    title: 'Voice-Matched Messaging',
    description:
      'Answer 5 questions at setup. Every message Always On sends sounds like you wrote it — your sign-off, your tone, your market.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
  },
  {
    title: 'Listing Description Writer',
    description:
      'Enter property details, get MLS copy, a social media caption, and a buyer announcement email — all in one click.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
      </svg>
    ),
  },
  {
    title: 'Inbound Reply Dashboard',
    description:
      'Every reply from every lead in one place — SMS and email. See who responded and reply directly without switching apps.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
      </svg>
    ),
  },
  {
    title: 'Transaction Milestone Updates',
    description:
      'Draft client messages for every California escrow milestone — offer accepted, inspection, appraisal, clear to close, keys.',
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
    description:
      'Import a CSV or enter leads manually. The first follow-up fires within minutes, automatically.',
  },
  {
    emoji: '🎙️',
    title: 'Set your AI voice',
    description:
      'Answer 5 quick questions about your style. Done once — every message sounds authentically like you.',
  },
  {
    emoji: '📲',
    title: 'Let Always On work',
    description:
      'AI sends follow-ups on your schedule. You get notified the moment a lead replies.',
  },
];

const TESTIMONIALS = [
  {
    quote:
      'I used to lose leads because I was showing another property. Now Always On fires a text within minutes and I have conversations started before I even check my phone. It paid for itself in the first two weeks.',
    name: 'Mike R.',
    title: 'Compass · Pasadena, CA',
    initials: 'MR',
  },
  {
    quote:
      'Setup took me 20 minutes. The messages sound exactly like me — my clients have no idea it\'s AI. I booked four extra showings in my first month without sending a single manual follow-up.',
    name: 'Sarah T.',
    title: 'Keller Williams · San Diego, CA',
    initials: 'ST',
  },
  {
    quote:
      'I was spending three hours a week on follow-up texts. That time is completely mine back. My response rate went up and I stopped dreading Monday mornings.',
    name: 'David L.',
    title: 'Coldwell Banker · Los Angeles, CA',
    initials: 'DL',
  },
];

type CellValue = 'yes' | 'no' | 'partial' | string;

const COMPARISON: {
  feature:  string;
  alwayson: CellValue;
  ylopo:    CellValue;
  kvcore:   CellValue;
  fub:      CellValue;
}[] = [
  { feature: 'Monthly price',              alwayson: '$149',       ylopo: '$295–$695+',    kvcore: '$499–$1,299+', fub: '$69–$1,000+' },
  { feature: 'AI-written follow-up',       alwayson: 'yes',        ylopo: 'partial',       kvcore: 'partial',      fub: 'no'          },
  { feature: 'Matches your voice',         alwayson: 'yes',        ylopo: 'no',            kvcore: 'no',           fub: 'no'          },
  { feature: 'Built for solo agents',      alwayson: 'yes',        ylopo: 'no',            kvcore: 'no',           fub: 'partial'     },
  { feature: 'Listing description writer', alwayson: 'yes',        ylopo: 'no',            kvcore: 'no',           fub: 'no'          },
  { feature: 'Setup time',                 alwayson: '10 minutes', ylopo: '2–5 days',      kvcore: '1–2 weeks',    fub: '1–3 days'    },
  { feature: 'Annual contract required',   alwayson: 'no',         ylopo: 'yes',           kvcore: 'yes',          fub: 'no'          },
  { feature: 'Money-back guarantee',       alwayson: '30 days',    ylopo: 'no',            kvcore: 'no',           fub: 'no'          },
];

const PLAN_FEATURES = [
  'Unlimited leads — no per-seat or per-lead pricing',
  '14-day automated SMS + email follow-up sequences',
  'AI voice matching — set up once, always sounds like you',
  'Listing description writer — MLS, social, and email copy',
  'Inbound reply dashboard',
  'Transaction milestone message drafts',
  'Lead pipeline with status tracking and score',
  'California-specific prompts and escrow language',
  'Dedicated Twilio number — your leads see a real phone number',
];

const FAQ = [
  {
    q: 'Does it actually sound like me, or like a robot?',
    a: 'During setup you answer 5 short questions: your communication style, a phrase you use often, what sets you apart, your market area, and a sample message. Every AI-generated follow-up is built from those answers. Agents consistently say the messages read like something they\'d actually send.',
  },
  {
    q: 'What happens when a lead replies?',
    a: 'Always On detects the reply and surfaces it in your inbound dashboard. The automated sequence pauses automatically — no awkward follow-up fires after they\'ve already responded. You take over the conversation from there.',
  },
  {
    q: 'How is this different from Ylopo, kvCORE, or Sierra Interactive?',
    a: 'Those platforms are built for brokerages with marketing staff, a learning curve measured in weeks, and price tags to match. Always On is purpose-built for the solo agent. One person, 10-minute setup, $149/month — with AI that matches your voice instead of sending generic blasts.',
  },
  {
    q: 'What\'s the money-back guarantee?',
    a: 'If Always On doesn\'t measurably improve your lead response time within 30 days, email us for a full refund. No questions, no runaround. We\'re confident in the product — that\'s why we can offer this.',
  },
  {
    q: 'What about Twilio and email costs — are those included?',
    a: 'Your dedicated Twilio number is included in the $149/month. Message delivery through Twilio SMS and SendGrid email is usage-based at very low per-message rates — most solo agents spend $5–$15/month. Always On walks you through the one-time 5-minute setup during onboarding.',
  },
  {
    q: 'Can I pause or stop the AI for a specific lead?',
    a: 'Yes. You can pause a lead\'s sequence any time from the lead detail view. When you\'re ready to re-engage, resume it with one click and Always On picks up where it left off.',
  },
];
