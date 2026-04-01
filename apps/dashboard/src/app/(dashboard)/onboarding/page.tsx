'use client';

import { useState } from 'react';
import { saveVoiceProfile, skipOnboarding, type VoiceProfileAnswers } from './actions';

// ─── Types ────────────────────────────────────────────────────────────────────

type AnswerKey = keyof VoiceProfileAnswers;

interface Question {
  key:         AnswerKey;
  step:        number;
  label:       string;
  subtext:     string;
  type:        'choice' | 'text' | 'textarea';
  placeholder?: string;
  choices?:    { value: string; label: string; description: string }[];
}

// ─── Questions ────────────────────────────────────────────────────────────────

const QUESTIONS: Question[] = [
  {
    key:     'communicationStyle',
    step:    1,
    label:   'How would you describe your communication style with clients?',
    subtext: 'This shapes how your AI messages sound. Choose the one that feels most like you.',
    type:    'choice',
    choices: [
      {
        value:       'formal',
        label:       'Formal',
        description: 'Professional and polished. You keep communication precise and business-like.',
      },
      {
        value:       'casual',
        label:       'Casual',
        description: 'Relaxed and conversational. You text clients like you\'d text a colleague.',
      },
      {
        value:       'friendly',
        label:       'Friendly',
        description: 'Warm and personable. Building rapport with clients is your superpower.',
      },
    ],
  },
  {
    key:         'signaturePhrase',
    step:        2,
    label:       'What\'s a phrase or sign-off you use with clients?',
    subtext:     'Think of how you typically end a text or email — your go-to sign-off, a word you use often, or how you\'d describe your tone in one phrase. Skip this if nothing comes to mind.',
    type:        'text',
    placeholder: 'e.g. "Let\'s make it happen", "No pressure at all", "Straightforward and honest"',
  },
  {
    key:         'differentiator',
    step:        3,
    label:       'What sets you apart from other agents in your market?',
    subtext:     'Be specific. This helps the AI highlight your genuine strengths rather than generic talking points.',
    type:        'textarea',
    placeholder: 'e.g. I specialise in off-market listings and have 15 years of local experience in the San Gabriel Valley. My clients always say I make the process feel easy.',
  },
  {
    key:         'marketArea',
    step:        4,
    label:       'What\'s your primary market area?',
    subtext:     'Include the cities, neighbourhoods, or regions you work in most often.',
    type:        'text',
    placeholder: 'e.g. Pasadena, Arcadia, San Marino, and the broader San Gabriel Valley',
  },
  {
    key:         'sampleSentence',
    step:        5,
    label:       'Write a sample message you might actually send a new buyer lead.',
    subtext:     'Don\'t overthink it — just type something you\'d genuinely send. This is your voice fingerprint.',
    type:        'textarea',
    placeholder: 'e.g. Hey Sarah! I saw you were checking out some homes in Pasadena — great area. I know it really well and have a few off-market options that might fit what you\'re after. Worth a quick chat?',
  },
];

const TOTAL = QUESTIONS.length;

const EMPTY: VoiceProfileAnswers = {
  communicationStyle: '',
  signaturePhrase:    '',
  differentiator:     '',
  marketArea:         '',
  sampleSentence:     '',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [step, setStep]         = useState(0);
  const [answers, setAnswers]   = useState<VoiceProfileAnswers>(EMPTY);
  const [loading, setLoading]   = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [error, setError]       = useState('');

  const q           = QUESTIONS[step];
  const currentVal  = answers[q.key];
  const canAdvance  = currentVal.trim().length > 0;
  const isFirst     = step === 0;
  const isLast      = step === TOTAL - 1;
  const progress    = ((step) / TOTAL) * 100;

  function setAnswer(key: AnswerKey, value: string) {
    setAnswers(prev => ({ ...prev, [key]: value }));
  }

  function handleNext() {
    if (!canAdvance) return;
    setError('');
    setStep(s => s + 1);
  }

  function handleBack() {
    setError('');
    setStep(s => s - 1);
  }

  async function handleComplete() {
    if (!canAdvance) return;
    setLoading(true);
    setError('');

    const result = await saveVoiceProfile(answers);
    // redirect() in the server action handles navigation on success
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  async function handleSkip() {
    setSkipping(true);
    setError('');
    const result = await skipOnboarding();
    if (result?.error) {
      setError(result.error);
      setSkipping(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && q.type !== 'textarea') {
      e.preventDefault();
      if (canAdvance) isLast ? handleComplete() : handleNext();
    }
  }

  const inputBase = 'w-full px-4 py-3 text-base bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition placeholder-gray-400';

  return (
    <div className="min-h-full flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-xl">

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 overflow-hidden">

          {/* Progress bar */}
          <div className="h-1 bg-gray-100">
            <div
              className="h-full bg-indigo-600 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step counter */}
          <div className="flex items-center justify-between px-8 pt-6 pb-0">
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-widest">
              Set up your AI voice
            </span>
            <span className="text-xs text-gray-400 font-medium tabular-nums">
              {step + 1} of {TOTAL}
            </span>
          </div>

          {/* Question */}
          <div
            key={step}
            className="px-8 pt-6 pb-8 animate-fade-slide"
          >
            <h2 className="text-xl font-bold text-gray-900 leading-snug mb-2">
              {q.label}
            </h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              {q.subtext}
            </p>

            {/* Choice question */}
            {q.type === 'choice' && q.choices && (
              <div className="space-y-3">
                {q.choices.map(choice => {
                  const selected = currentVal === choice.value;
                  return (
                    <button
                      key={choice.value}
                      type="button"
                      onClick={() => setAnswer(q.key, choice.value)}
                      className={`w-full text-left px-4 py-4 rounded-xl border-2 transition-all ${
                        selected
                          ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                          selected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
                        }`}>
                          {selected && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <div>
                          <div className={`text-sm font-semibold ${selected ? 'text-indigo-700' : 'text-gray-800'}`}>
                            {choice.label}
                          </div>
                          <div className="text-sm text-gray-500 mt-0.5 leading-relaxed">
                            {choice.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Text input */}
            {q.type === 'text' && (
              <input
                type="text"
                autoFocus
                className={inputBase}
                placeholder={q.placeholder}
                value={currentVal}
                onChange={e => setAnswer(q.key, e.target.value)}
                onKeyDown={handleKeyDown}
              />
            )}

            {/* Textarea */}
            {q.type === 'textarea' && (
              <textarea
                autoFocus
                className={`${inputBase} resize-none leading-relaxed`}
                rows={4}
                placeholder={q.placeholder}
                value={currentVal}
                onChange={e => setAnswer(q.key, e.target.value)}
              />
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 flex items-start gap-2.5 px-3.5 py-3 bg-red-50 border border-red-200 rounded-xl">
                <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>

          {/* Navigation footer */}
          <div className="flex items-center px-8 py-5 border-t border-gray-100 bg-gray-50 justify-between">
            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading || skipping}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                  </svg>
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={handleSkip}
                disabled={loading || skipping}
                className="px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40"
              >
                {skipping ? 'Skipping…' : 'Skip for now'}
              </button>
            </div>

            {!isLast ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canAdvance || skipping}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                Continue
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                disabled={!canAdvance || loading || skipping}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
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
                    Finish setup
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-2 mt-5">
          {QUESTIONS.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === step
                  ? 'w-5 h-2 bg-indigo-600'
                  : i < step
                  ? 'w-2 h-2 bg-indigo-300'
                  : 'w-2 h-2 bg-gray-200'
              }`}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
