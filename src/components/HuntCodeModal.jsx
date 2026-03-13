import React, { useState } from 'react';
import { Compass, AlertCircle } from 'lucide-react';
import { useSideQuest } from '../context/SideQuestContext';

const HuntCodeModal = () => {
  const { enterHuntAccessCode, activeEvent } = useSideQuest();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.trim().length < 3) return;
    setLoading(true);
    setError('');
    const result = await enterHuntAccessCode(code.trim());
    setLoading(false);
    if (result !== 'OK') {
      setError('Incorrect code. Ask your Game Master for the access code.');
      setCode('');
    }
  };

  return (
    <div className="fixed inset-0 z-[1500] bg-brand-900 flex flex-col items-center justify-center px-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-teal-400/20 border-2 border-teal-400/40 flex items-center justify-center">
            <Compass size={36} className="text-teal-300" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-white text-center mb-2">
          {activeEvent?.name || 'Unlock Colombo'}
        </h1>
        <p className="text-white/50 text-center mb-8 text-sm">
          Enter the access code announced by your Game Master to begin the race.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="ACCESS CODE"
            maxLength={20}
            className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-6 py-4
              text-white font-extrabold text-xl text-center tracking-[0.3em] uppercase
              placeholder-white/20 focus:outline-none focus:border-teal-400 transition-all"
          />

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.trim().length < 3}
            className="w-full bg-teal-400 hover:bg-teal-300 disabled:opacity-40
              text-brand-900 font-extrabold text-lg py-4 rounded-2xl transition-all"
          >
            {loading ? 'Checking...' : 'Enter Hunt'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default HuntCodeModal;