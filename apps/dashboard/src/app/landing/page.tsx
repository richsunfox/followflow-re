import Link from 'next/link';

// ─── Design tokens (as inline values for this server component) ───────────────
const C = {
  navy:    '#0F1629',
  surface: '#1A2540',
  light:   '#F7F8FC',
  blue:    '#3B7BFF',
  gold:    '#C9A84C',
  border:  '#1E2D4A',
  muted:   '#8B9BB4',
};

// ─── Small shared primitives ──────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-xs font-semibold tracking-[0.18em] uppercase mb-4" style={{ color: C.muted }}>
      {children}
    </p>
  );
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0"
        style={{ background: `${C.blue}18`, border: `1px solid ${C.blue}30` }}>
        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke={C.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="text-sm leading-relaxed" style={{ color: '#CBD5E1' }}>{children}</span>
    </li>
  );
}

function StarRow() {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className="w-4 h-4" viewBox="0 0 20 20" fill="#F59E0B">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen font-sans antialiased" style={{ background: C.navy, color: '#fff' }}>

      {/* ══════════════════════════════════════════════════════════════════════
          NAV
      ════════════════════════════════════════════════════════════════════════ */}
      <header
        className="sticky top-0 z-50"
        style={{ background: `${C.navy}F5`, backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}` }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: C.blue, boxShadow: `0 0 18px ${C.blue}55` }}>
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-none tracking-[-0.01em]">Always On</div>
              <div className="text-[9px] font-semibold leading-none mt-[3px] tracking-[0.2em] uppercase" style={{ color: C.muted }}>
                The Follow Through System
              </div>
            </div>
          </div>

          {/* Links */}
          <nav className="hidden md:flex items-center gap-8">
            {['Features', 'How it works', 'Pricing'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`}
                className="text-sm transition-colors duration-150 hover:text-white"
                style={{ color: C.muted }}>
                {l}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm transition-colors hover:text-white" style={{ color: C.muted }}>
              Sign in
            </Link>
            <Link href="/signup"
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-150 hover:brightness-110"
              style={{ background: C.blue, boxShadow: `0 0 18px ${C.blue}40` }}>
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════════════════════════ */}
      <section id="features" className="relative overflow-hidden py-20 md:py-28">
        {/* Subtle grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `linear-gradient(${C.blue}07 1px, transparent 1px), linear-gradient(90deg, ${C.blue}07 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }} />
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[520px] pointer-events-none"
          style={{ background: `radial-gradient(ellipse, ${C.blue}14 0%, transparent 60%)` }} />

        <div className="relative max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* ── Left: copy ── */}
            <div>
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-8"
                style={{ borderColor: `${C.blue}30`, background: `${C.blue}0D` }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.blue }} />
                <span className="text-xs font-semibold tracking-[0.14em] uppercase" style={{ color: C.blue }}>
                  AI Follow-Up for Solo Agents
                </span>
              </div>

              <h1 className="text-5xl sm:text-[56px] font-extrabold text-white leading-[1.05] tracking-[-0.02em] mb-6">
                Every lead<br />
                followed up.<br />
                <span style={{ color: C.blue }}>Every time.</span>
              </h1>

              <p className="text-lg leading-relaxed mb-10 max-w-lg" style={{ color: '#94A3B8' }}>
                Always On starts a 14-day, voice-matched follow-up sequence the moment
                a new lead comes in — SMS and email, written to sound like you.
                You focus on closing. We handle the follow-through.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-10">
                <Link href="/signup"
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-base text-white transition-all duration-150 hover:brightness-110 hover:-translate-y-0.5"
                  style={{ background: C.blue, boxShadow: `0 0 40px ${C.blue}45` }}>
                  Start your follow-through
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <p className="text-sm" style={{ color: C.muted }}>
                  $149/month · Cancel anytime
                </p>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-x-8 gap-y-4 pt-6" style={{ borderTop: `1px solid ${C.border}` }}>
                {[
                  { value: '< 5 min', label: 'First follow-up' },
                  { value: '14 days', label: 'Automated sequence' },
                  { value: '9×',      label: 'Higher conversion' },
                ].map(s => (
                  <div key={s.label}>
                    <div className="text-xl font-bold text-white leading-none">{s.value}</div>
                    <div className="text-xs font-medium mt-1" style={{ color: C.muted }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: product mockup ── */}
            <div className="lg:pl-4">
              <div className="rounded-2xl overflow-hidden border"
                style={{
                  background: C.surface,
                  borderColor: C.border,
                  boxShadow: `0 0 80px ${C.blue}12, 0 40px 80px rgba(0,0,0,0.5)`,
                }}>
                {/* Window chrome */}
                <div className="flex items-center gap-3 px-5 py-3.5 border-b"
                  style={{ borderColor: C.border, background: 'rgba(255,255,255,0.02)' }}>
                  <div className="flex gap-1.5">
                    {[0,1,2].map(i => <div key={i} className="w-3 h-3 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />)}
                  </div>
                  <div className="flex-1 mx-3">
                    <div className="rounded-md px-3 py-1 text-[11px] font-mono text-center max-w-[200px] mx-auto"
                      style={{ background: 'rgba(255,255,255,0.04)', color: C.muted }}>
                      alwayson.ai / leads
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[11px] font-semibold text-green-400">Live</span>
                  </div>
                </div>

                {/* Lead rows */}
                <div className="divide-y" style={{ borderColor: `${C.border}80` }}>
                  {MOCK_LEADS.map((lead, i) => (
                    <div key={i} className="px-5 py-4">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ background: `${C.blue}20`, border: `1px solid ${C.blue}30`, color: C.blue }}>
                            {lead.initials}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white leading-none">{lead.name}</div>
                            <div className="text-[11px] mt-0.5" style={{ color: C.muted }}>{lead.detail}</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                          style={lead.converted
                            ? { background: 'rgba(34,197,94,0.1)', color: '#4ADE80', borderColor: 'rgba(34,197,94,0.2)' }
                            : { background: `${C.blue}15`, color: C.blue, borderColor: `${C.blue}25` }}>
                          {lead.status}
                        </span>
                      </div>
                      {lead.message && (
                        <div className="ml-10 text-xs leading-relaxed rounded-lg px-3 py-2"
                          style={{ background: `${C.blue}0A`, border: `1px solid ${C.blue}18`, color: '#94A3B8' }}>
                          <span className="font-medium mr-1" style={{ color: C.blue }}>✦</span>
                          {lead.message}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Status bar */}
                <div className="px-5 py-3 flex items-center justify-between border-t"
                  style={{ borderColor: C.border, background: 'rgba(255,255,255,0.01)' }}>
                  <span className="text-[11px]" style={{ color: C.muted }}>3 sequences running</span>
                  <span className="text-[11px]" style={{ color: C.muted }}>Next send: 9:00 AM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          PROBLEM — light background
      ════════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28" style={{ background: C.light }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <SectionLabel>The Problem</SectionLabel>
            <h2 className="text-4xl font-bold leading-tight tracking-tight mb-4" style={{ color: C.navy }}>
              You're losing deals<br />to silence.
            </h2>
            <p className="text-lg leading-relaxed" style={{ color: '#475569' }}>
              The agent who responds first wins the client. But you're showing properties,
              attending closings, and running a business. Nobody has time for perfect follow-up.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PAIN_POINTS.map((p, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border shadow-sm"
                style={{ borderColor: '#E2E8F0' }}>
                {/* Stat */}
                <div className="text-4xl font-extrabold leading-none mb-3 tracking-tight"
                  style={{ color: i === 0 ? C.blue : C.navy }}>
                  {p.stat}
                </div>
                <p className="text-sm font-semibold mb-2" style={{ color: C.navy }}>{p.headline}</p>
                <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          HOW IT WORKS — dark background
      ════════════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-20 md:py-28" style={{ background: C.navy }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-xl mx-auto text-center mb-16">
            <SectionLabel>How it works</SectionLabel>
            <h2 className="text-4xl font-bold tracking-tight mb-4 text-white">
              Set it once. Let it run.
            </h2>
            <p className="text-lg leading-relaxed" style={{ color: '#94A3B8' }}>
              Three steps. Zero manual effort. Your leads never fall through the cracks again.
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {HOW_STEPS.map((step, i) => (
              <div key={i} className="relative">
                {/* Connector line */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-6 left-[calc(50%+2.5rem)] right-0 h-px"
                    style={{ background: `linear-gradient(90deg, ${C.border}, ${C.border}40)` }} />
                )}
                <div className="flex flex-col items-center text-center">
                  {/* Step number + emoji */}
                  <div className="relative mb-6">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                      style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: `0 0 24px ${C.blue}0F` }}>
                      {step.emoji}
                    </div>
                    <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-black"
                      style={{ background: C.blue, boxShadow: `0 0 10px ${C.blue}60` }}>
                      {i + 1}
                    </div>
                  </div>
                  <h3 className="font-bold text-white mb-2 text-base">{step.title}</h3>
                  <p className="text-sm leading-relaxed max-w-[220px]" style={{ color: '#94A3B8' }}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Sequence flow graphic ── */}
          <div className="rounded-2xl p-8 border overflow-x-auto" style={{ background: C.surface, borderColor: C.border }}>
            <p className="text-xs font-semibold tracking-[0.16em] uppercase mb-8 text-center" style={{ color: C.muted }}>
              Your 14-day sequence — automatic, voice-matched, every time
            </p>
            <div className="flex items-start gap-0 min-w-[680px]">
              {SEQUENCE_NODES.map((node, i) => (
                <div key={i} className="flex items-center flex-1">
                  {/* Node */}
                  <div className="flex flex-col items-center flex-1">
                    {/* Circle */}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3 relative z-10"
                      style={
                        node.highlight
                          ? { background: '#22C55E18', border: '1px solid #22C55E40' }
                          : node.isLead
                            ? { background: `${C.blue}18`, border: `1px solid ${C.blue}35` }
                            : { background: C.surface, border: `1px solid ${C.border}` }
                      }>
                      {node.icon}
                    </div>
                    {/* Label */}
                    <div className="text-[11px] font-semibold text-white text-center leading-tight mb-0.5">
                      {node.label}
                    </div>
                    <div className="text-[10px] text-center" style={{ color: C.muted }}>
                      {node.sublabel}
                    </div>
                  </div>

                  {/* Connector */}
                  {i < SEQUENCE_NODES.length - 1 && (
                    <div className="h-px w-full -mt-8 mx-1 shrink-0"
                      style={{
                        background: SEQUENCE_NODES[i + 1]?.highlight
                          ? 'linear-gradient(90deg, #22C55E40, #22C55E80)'
                          : `linear-gradient(90deg, ${C.border}, ${C.border}80)`,
                      }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SOCIAL PROOF — surface background
      ════════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 border-y" style={{ background: C.surface, borderColor: C.border }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <SectionLabel>From the field</SectionLabel>
            <h2 className="text-4xl font-bold tracking-tight text-white">
              Agents who stopped losing deals
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="rounded-2xl p-7 flex flex-col border"
                style={{ background: `${C.navy}80`, borderColor: C.border }}>
                <StarRow />
                <blockquote className="text-sm leading-relaxed flex-1 my-5" style={{ color: '#CBD5E1' }}>
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div className="flex items-center gap-3 pt-5 border-t" style={{ borderColor: C.border }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: `${C.blue}20`, border: `1px solid ${C.blue}30`, color: C.blue }}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-white text-sm font-semibold leading-tight">{t.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: C.muted }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          PRICING — light background
      ════════════════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-20 md:py-28" style={{ background: C.light }}>
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-12">
            <SectionLabel>Pricing</SectionLabel>
            <h2 className="text-4xl font-bold tracking-tight mb-3" style={{ color: C.navy }}>
              One plan. Everything included.
            </h2>
            <p className="text-lg" style={{ color: '#475569' }}>
              No tiers. No add-ons. No surprises.
            </p>
          </div>

          <div className="bg-white rounded-2xl border p-8 shadow-card" style={{ borderColor: '#E2E8F0' }}>
            {/* Price */}
            <div className="flex items-end gap-2 mb-1">
              <span className="text-6xl font-extrabold tracking-tight" style={{ color: C.navy }}>$149</span>
              <span className="text-slate-400 pb-3 text-lg">/month</span>
            </div>
            <p className="text-sm text-slate-500 mb-8">Month-to-month. Cancel anytime.</p>

            {/* Guarantee badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 border"
              style={{ background: `${C.gold}12`, borderColor: `${C.gold}30` }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke={C.gold}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
              <span className="text-sm font-semibold" style={{ color: C.gold }}>30-day money-back guarantee</span>
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8">
              {PLAN_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: `${C.blue}15`, border: `1px solid ${C.blue}25` }}>
                    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke={C.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="text-sm text-slate-600 leading-relaxed">{f}</span>
                </li>
              ))}
            </ul>

            <Link href="/signup"
              className="flex items-center justify-center gap-2.5 w-full py-4 rounded-xl font-bold text-base text-white transition-all duration-150 hover:brightness-110 hover:-translate-y-0.5"
              style={{ background: C.blue, boxShadow: `0 0 30px ${C.blue}35` }}>
              Get started — $149/month
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <p className="text-center text-xs text-slate-400 mt-3">
              No contract · Cancel anytime · 30-day money-back guarantee
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FAQ — dark background
      ════════════════════════════════════════════════════════════════════════ */}
      <section id="faq" className="py-20 md:py-28 border-t" style={{ background: C.navy, borderColor: C.border }}>
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-12">
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="text-3xl font-bold tracking-tight text-white">Common questions</h2>
          </div>
          <div className="space-y-2">
            {FAQ.map((item, i) => (
              <details key={i} className="group rounded-xl overflow-hidden border transition-colors"
                style={{ background: `${C.surface}80`, borderColor: C.border }}>
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer font-semibold text-white text-sm list-none select-none">
                  {item.q}
                  <svg className="w-4 h-4 shrink-0 ml-4 transition-transform duration-200 group-open:rotate-180"
                    style={{ color: C.muted }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </summary>
                <div className="px-6 pb-5 pt-1 text-sm leading-relaxed border-t"
                  style={{ color: '#94A3B8', borderColor: C.border }}>
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FINAL CTA — dark with glow
      ════════════════════════════════════════════════════════════════════════ */}
      <section className="py-28 relative overflow-hidden border-t" style={{ background: C.navy, borderColor: C.border }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full"
            style={{ background: `radial-gradient(ellipse, ${C.blue}0E 0%, transparent 65%)` }} />
        </div>
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border mb-8"
            style={{ borderColor: `${C.blue}25`, background: `${C.blue}0D` }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.blue }} />
            <span className="text-xs font-bold tracking-[0.14em] uppercase" style={{ color: C.blue }}>
              30-day money-back guarantee
            </span>
          </div>

          <h2 className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight mb-5 leading-[1.04]">
            Always On.<br />
            <span style={{ color: C.blue }}>Always following up.</span>
          </h2>
          <p className="text-lg mb-10 max-w-lg mx-auto leading-relaxed" style={{ color: '#94A3B8' }}>
            If Always On doesn&apos;t measurably improve your lead response time within 30 days,
            you get a full refund. No questions. No runaround.
          </p>
          <Link href="/signup"
            className="inline-flex items-center gap-3 px-10 py-5 rounded-xl font-black text-lg text-white transition-all duration-150 hover:brightness-110 hover:-translate-y-1"
            style={{ background: C.blue, boxShadow: `0 0 60px ${C.blue}50` }}>
            Get started — $149/month
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <p className="text-sm mt-5" style={{ color: '#475569' }}>
            Cancel anytime · Month-to-month · No contracts
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════════════════════════ */}
      <footer className="py-10 border-t" style={{ background: '#0A1020', borderColor: C.border }}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: C.blue }}>
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <div>
              <div className="text-white text-sm font-bold leading-none">Always On</div>
              <div className="text-[9px] font-semibold leading-none mt-[3px] tracking-[0.2em] uppercase" style={{ color: C.muted }}>
                The Follow Through System
              </div>
            </div>
          </div>

          <p className="text-xs" style={{ color: '#374151' }}>© 2026 Always On. All rights reserved.</p>

          <div className="flex items-center gap-6 text-xs" style={{ color: '#374151' }}>
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Terms</span>
            <Link href="/login" className="hover:text-slate-400 transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}

// ─── Page data ────────────────────────────────────────────────────────────────

const MOCK_LEADS = [
  {
    initials: 'SM', name: 'Sarah Mitchell', detail: 'Buyer · Day 3 of 14',
    status: 'In Sequence', converted: false,
    message: '"Hey Sarah, quick question — still focused on Pasadena, or has the search expanded? I have a few coming up. — Mike"',
  },
  {
    initials: 'JT', name: 'James Torres', detail: 'Buyer · Day 1 of 14',
    status: 'In Sequence', converted: false,
    message: 'Sequence started · Day 3 email queued',
  },
  {
    initials: 'MC', name: 'Maria Chen', detail: 'Seller · Closed',
    status: 'Converted ✓', converted: true,
    message: null,
  },
];

const PAIN_POINTS = [
  {
    stat: '78%',
    headline: 'of buyers pick the first agent who responds',
    body: 'Speed to lead is the single biggest predictor of who gets the commission. Not experience. Not reviews.',
  },
  {
    stat: '9×',
    headline: 'higher conversion when contacted in under 5 minutes',
    body: 'After 30 minutes, a lead\'s likelihood of converting drops by more than 80%. Every minute costs you.',
  },
  {
    stat: '44%',
    headline: 'of agents never follow up after the first contact',
    body: 'Almost half your competition goes silent after day one. Always On runs for 14 days automatically.',
  },
];

const HOW_STEPS = [
  {
    emoji: '📲',
    title: 'Lead comes in',
    body: 'Add a lead manually or import a CSV. Always On starts the sequence within minutes — no setup required per lead.',
  },
  {
    emoji: '✦',
    title: 'AI sends 7 voice-matched messages',
    body: 'SMS and email, written in your voice, over 14 days. Each message is timed and worded to feel natural — not automated.',
  },
  {
    emoji: '🔔',
    title: 'Lead replies — you take over',
    body: 'The moment a lead responds, the sequence pauses and you get notified instantly. From there, it\'s your conversation.',
  },
];

const SEQUENCE_NODES = [
  {
    label: 'Lead in',
    sublabel: 'Day 0',
    isLead: true,
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#3B7BFF" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
      </svg>
    ),
  },
  {
    label: 'SMS',
    sublabel: 'Day 1',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#8B9BB4" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
  },
  {
    label: 'Email',
    sublabel: 'Day 3',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#8B9BB4" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
  },
  {
    label: 'SMS',
    sublabel: 'Day 7',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#8B9BB4" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
  },
  {
    label: 'Reply ✓',
    sublabel: 'Detected',
    highlight: true,
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: 'You',
    sublabel: 'Notified',
    highlight: true,
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    ),
  },
];

const TESTIMONIALS = [
  {
    quote: 'I used to lose leads because I was showing another property. Now Always On fires a text within minutes. I\'ve had conversations started before I even checked my phone.',
    name: 'Mike R.',
    role: 'Compass · Pasadena, CA',
    initials: 'MR',
  },
  {
    quote: 'Setup took 20 minutes. The messages sound exactly like me — my clients have no idea it\'s AI. I booked four extra showings in my first month without sending a single manual follow-up.',
    name: 'Sarah T.',
    role: 'Keller Williams · San Diego, CA',
    initials: 'ST',
  },
  {
    quote: 'I was spending three hours a week on follow-up texts. That time is completely mine back. My response rate went up and I stopped dreading the Monday morning catch-up.',
    name: 'David L.',
    role: 'Coldwell Banker · Los Angeles, CA',
    initials: 'DL',
  },
];

const PLAN_FEATURES = [
  'Unlimited leads — no per-seat pricing',
  '14-day automated SMS + email sequences',
  'AI voice matching — set up once, always sounds like you',
  'Listing description writer (MLS, social, email)',
  'Inbound reply dashboard',
  'Dedicated Twilio number included',
  'California-specific prompts and escrow language',
  '30-day money-back guarantee',
];

const FAQ = [
  {
    q: 'Does it actually sound like me, or like a robot?',
    a: 'During setup you answer 5 short questions: your communication style, a phrase you use often, what sets you apart, your market, and a sample message. Every AI message is generated from those answers. Agents consistently say the messages read like something they\'d actually send.',
  },
  {
    q: 'What happens when a lead replies?',
    a: 'Always On detects the reply, pauses the sequence, and notifies you instantly. No awkward follow-up fires after they\'ve already responded. You take over the conversation from there.',
  },
  {
    q: 'Can I pause or stop the AI for a specific lead?',
    a: 'Yes — from the lead detail view, you can pause, resume, or end the sequence at any time. Full control, always.',
  },
  {
    q: 'What\'s the money-back guarantee?',
    a: 'If Always On doesn\'t measurably improve your lead response time within 30 days, email us for a full refund. No questions. We\'re confident in the product — that\'s why we can offer this.',
  },
  {
    q: 'How is this different from Ylopo, kvCORE, or Follow Up Boss?',
    a: 'Those platforms are built for brokerages with marketing teams and multi-thousand-dollar budgets. Always On is purpose-built for the solo agent. 10-minute setup, $149/month, AI that actually sounds like you.',
  },
];
