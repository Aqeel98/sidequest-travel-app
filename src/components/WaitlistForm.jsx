import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const DONE_KEY = 'sq_waitlist_joined';

const readDone = () => {
  try { return localStorage.getItem(DONE_KEY) === '1'; } catch { return false; }
};

// One-field launch email signup. Writes to the `launch_waitlist` table
// (insert-only for the public; see supabase/migrations/*_launch_waitlist.sql).
export default function WaitlistForm({ source = 'holding_page' }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(readDone() ? 'done' : 'idle'); // idle | sending | done | error

  const submit = async (e) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!clean) return;
    setStatus('sending');
    const { error } = await supabase.from('launch_waitlist').insert({ email: clean, source });
    // 23505 = already on the list, which is fine.
    if (error && error.code !== '23505') {
      setStatus('error');
      return;
    }
    try { localStorage.setItem(DONE_KEY, '1'); } catch { /* private mode */ }
    setStatus('done');
  };

  if (status === 'done') {
    return (
      <p className="text-white font-semibold" role="status">
        You're on the list. We'll email you when we open.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="w-full">
      <label htmlFor={`wl-${source}`} className="block text-teal-50/90 mb-3">
        Get one email when we open
      </label>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:bg-white sm:rounded-full sm:p-1.5 sm:shadow-[0_18px_40px_-20px_rgba(19,78,74,0.7)]">
        <input
          id={`wl-${source}`}
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 min-w-0 bg-white rounded-full px-5 py-3 text-gray-800 placeholder:text-gray-400 outline-none focus-visible:ring-2 focus-visible:ring-brand-400 sm:focus-visible:ring-0"
        />
        <button
          type="submit"
          disabled={status === 'sending'}
          className="bg-brand-600 hover:bg-brand-800 text-white font-bold px-6 py-3 rounded-full transition-colors disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {status === 'sending' ? 'Adding…' : 'Notify me'}
        </button>
      </div>
      <p className="mt-2 text-xs text-teal-50/75">
        {status === 'error'
          ? 'That didn’t go through. Check your connection and try again.'
          : 'Just the launch email. No spam.'}
      </p>
    </form>
  );
}
