'use client';

import { useState } from 'react';

export default function BillingPage() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handleSubscribe() {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Could not start checkout');
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md">

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-8 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Your account is not active</h1>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            An active subscription is required to use FollowFlow RE.
            Subscribe below to unlock your dashboard, AI follow-up sequences, and listing writer.
          </p>

          {/* Plan summary */}
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-5 mb-6 text-left">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">FollowFlow RE</span>
              <span className="text-2xl font-black text-gray-900">$149<span className="text-sm font-normal text-gray-400">/mo</span></span>
            </div>
            <ul className="space-y-2">
              {[
                'Unlimited leads',
                '14-day AI follow-up sequences',
                'Voice-matched messaging',
                'Listing description writer',
                'Response time analytics',
              ].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-400 mt-4">
              30-day money-back guarantee. Cancel anytime.
            </p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 text-left">
              {error}
            </div>
          )}

          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Redirecting to checkout…
              </>
            ) : (
              <>
                Subscribe — $149/month
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
