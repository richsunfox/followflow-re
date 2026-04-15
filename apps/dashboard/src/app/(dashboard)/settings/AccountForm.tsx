'use client';

import { useState } from 'react';
import { updateProfile } from './actions';

interface Props {
  fullName:  string;
  email:     string;
  brokerage: string;
  phone:     string;
}

export default function AccountForm({ fullName, email, brokerage, phone }: Props) {
  const [editing,   setEditing]   = useState(false);
  const [name,      setName]      = useState(fullName);
  const [broker,    setBroker]    = useState(brokerage);
  const [tel,       setTel]       = useState(phone);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [saved,     setSaved]     = useState(false);

  const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition placeholder-gray-400';

  function handleCancel() {
    setName(fullName);
    setBroker(brokerage);
    setTel(phone);
    setError('');
    setEditing(false);
  }

  async function handleSave() {
    setError('');
    setLoading(true);
    const result = await updateProfile({ fullName: name, brokerage: broker, phone: tel });
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  return (
    <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">Account</h2>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
          >
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white text-xs font-medium rounded-lg transition-colors"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving…
                </>
              ) : 'Save'}
            </button>
          </div>
        )}
      </div>

      <div className="px-6 py-5 space-y-4">

        {/* Email — never editable (Supabase auth owns it) */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email</p>
          <p className="text-sm text-gray-900">{email}</p>
        </div>

        {/* Name */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Full name</p>
          {editing ? (
            <input
              type="text"
              className={inputCls}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Jane Smith"
              autoFocus
            />
          ) : (
            <p className="text-sm text-gray-900">{name || '—'}</p>
          )}
        </div>

        {/* Brokerage */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Brokerage</p>
          {editing ? (
            <input
              type="text"
              className={inputCls}
              value={broker}
              onChange={e => setBroker(e.target.value)}
              placeholder="Keller Williams, Compass…"
            />
          ) : (
            <p className="text-sm text-gray-900">{broker || <span className="text-gray-400">Not set</span>}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Phone</p>
          {editing ? (
            <input
              type="tel"
              className={inputCls}
              value={tel}
              onChange={e => setTel(e.target.value)}
              placeholder="(310) 555-0100"
            />
          ) : (
            <p className="text-sm text-gray-900">{tel || <span className="text-gray-400">Not set</span>}</p>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-lg">
            <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {saved && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-green-50 border border-green-200 rounded-lg">
            <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            <p className="text-green-700 text-sm">Profile updated.</p>
          </div>
        )}
      </div>
    </section>
  );
}
