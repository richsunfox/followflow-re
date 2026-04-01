'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { addLead, type AddLeadData } from '@/app/(dashboard)/leads/actions';

const SOURCES = [
  { value: '',               label: 'Select source…' },
  { value: 'zillow',         label: 'Zillow' },
  { value: 'realtor_com',    label: 'Realtor.com' },
  { value: 'referral',       label: 'Referral' },
  { value: 'open_house',     label: 'Open house' },
  { value: 'social_media',   label: 'Social media' },
  { value: 'website',        label: 'Website' },
  { value: 'cold_outreach',  label: 'Cold outreach' },
  { value: 'other',          label: 'Other' },
];

const LEAD_TYPES = [
  { value: 'buyer',  label: 'Buyer' },
  { value: 'seller', label: 'Seller' },
  { value: 'both',   label: 'Both' },
];

const EMPTY: AddLeadData = {
  firstName: '', lastName: '', email: '', phone: '',
  source: '', leadType: 'buyer', budgetMin: '', budgetMax: '', notes: '',
};

export default function AddLeadModal() {
  const router  = useRouter();
  const [open, setOpen]     = useState(false);
  const [form, setForm]     = useState<AddLeadData>(EMPTY);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Focus first input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) handleClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function set(field: keyof AddLeadData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleClose() {
    if (loading) return;
    setOpen(false);
    setForm(EMPTY);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await addLead(form);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setLoading(false);
      handleClose();
      router.refresh();
    }
  }

  const inputCls  = 'w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition placeholder-gray-400 disabled:bg-gray-50 disabled:text-gray-400';
  const selectCls = `${inputCls} cursor-pointer`;
  const labelCls  = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5';

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add lead
      </button>

      {/* Backdrop + modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal card */}
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl ring-1 ring-gray-200 overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Add new lead</h2>
                <p className="text-sm text-gray-400 mt-0.5">Manually enter a lead into your pipeline</p>
              </div>
              <button
                onClick={handleClose}
                disabled={loading}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-5 space-y-5 max-h-[68vh] overflow-y-auto">

                {/* Name row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>First name <span className="text-red-400">*</span></label>
                    <input
                      ref={firstInputRef}
                      type="text"
                      className={inputCls}
                      placeholder="Jane"
                      value={form.firstName}
                      onChange={e => set('firstName', e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Last name <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      className={inputCls}
                      placeholder="Smith"
                      value={form.lastName}
                      onChange={e => set('lastName', e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Contact row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Email</label>
                    <input
                      type="email"
                      className={inputCls}
                      placeholder="jane@example.com"
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Phone</label>
                    <input
                      type="tel"
                      className={inputCls}
                      placeholder="(310) 555-0100"
                      value={form.phone}
                      onChange={e => set('phone', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Source + Lead type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Source</label>
                    <select
                      className={selectCls}
                      value={form.source}
                      onChange={e => set('source', e.target.value)}
                      disabled={loading}
                    >
                      {SOURCES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Lead type <span className="text-red-400">*</span></label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {LEAD_TYPES.map(t => (
                        <button
                          key={t.value}
                          type="button"
                          disabled={loading}
                          onClick={() => set('leadType', t.value)}
                          className={`py-2.5 rounded-lg border text-xs font-medium transition-all ${
                            form.leadType === t.value
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Budget row — only shown for buyers */}
                {(form.leadType === 'buyer' || form.leadType === 'both') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Budget min ($)</label>
                      <input
                        type="number"
                        className={inputCls}
                        placeholder="500000"
                        value={form.budgetMin}
                        onChange={e => set('budgetMin', e.target.value)}
                        min={0}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Budget max ($)</label>
                      <input
                        type="number"
                        className={inputCls}
                        placeholder="850000"
                        value={form.budgetMax}
                        onChange={e => set('budgetMax', e.target.value)}
                        min={0}
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className={labelCls}>Notes</label>
                  <textarea
                    className={`${inputCls} resize-none`}
                    rows={3}
                    placeholder="Looking for a 3BR in Pasadena, prefers quiet street, flexible on timeline…"
                    value={form.notes}
                    onChange={e => set('notes', e.target.value)}
                    disabled={loading}
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2.5 px-3.5 py-3 bg-red-50 border border-red-200 rounded-lg">
                    <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Saving…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Add lead
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
