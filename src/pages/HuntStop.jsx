import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSideQuest } from '../context/SideQuestContext';
import { MapPin, ArrowLeft, Loader2 } from 'lucide-react';

const HuntStop = () => {
  const { stopId } = useParams();
  const navigate = useNavigate();
  const {
    huntRoute, huntCompletions,
    enterStopUnlockCode, showToast,
  } = useSideQuest();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const isSubmitting = useRef(false);

  const routeRow = huntRoute.find(r => r.stop.id === stopId);
  const stop = routeRow?.stop;

  const completedStopIds = new Set(huntCompletions.map(c => c.stop_id));
  const activeStepIndex = huntRoute.findIndex(r => !completedStopIds.has(r.stop.id));
  const activeStop = huntRoute[activeStepIndex]?.stop;

  useEffect(() => {
  if (huntRoute.length > 0 && (!stop || activeStop?.id !== stopId)) {
    navigate('/hunt');
  }
}, [stop, activeStop, stopId, huntRoute.length]);
  
  if (!stop || activeStop?.id !== stopId) return null;

  const stepNumber = routeRow.step_number;
  const totalStops = huntRoute.length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.trim().length < 4) return;
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setLoading(true);

    const result = await enterStopUnlockCode(stopId, code.trim());
    setLoading(false);
    isSubmitting.current = false;

    if (result === 'OK') {
      showToast(`Stop cleared! +${stop.xp_value || 50} XP`, 'success');
      setTimeout(() => {
        window.location.href = '/hunt';
      }, 800);
    } else if (result === 'WRONG_CODE') {
      showToast('Incorrect code. Check with your SideQuest Assistant.', 'error');
      setCode('');
    } else if (result === 'ALREADY_DONE') {
      navigate('/hunt');
    } else {
      showToast('Network error. Try again.', 'error');
      setCode('');
    }
  };

  return (
    <div className="min-h-screen bg-brand-900 px-4 py-6 max-w-lg mx-auto">

      <button onClick={() => navigate('/hunt')} className="flex items-center gap-2 text-white/50 text-sm mb-6">
        <ArrowLeft size={16} /> Back to Route
      </button>

      <div className="mb-6">
        <p className="text-teal-400 text-xs uppercase tracking-widest font-bold mb-1">
          Stop {stepNumber} of {totalStops}
          {stop.partner_name && ` · ${stop.partner_name}`}
        </p>
        <h1 className="text-white font-extrabold text-3xl mb-4">{stop.title}</h1>

        <div className="bg-white/5 rounded-2xl p-5 mb-4 border border-white/10">
          <p className="text-white/50 text-xs uppercase tracking-widest font-bold mb-2">Your Clue</p>
          <p className="text-white/90 text-base leading-relaxed italic">{stop.riddle_text}</p>
        </div>

        <div className="bg-teal-500/10 rounded-2xl p-5 mb-4 border border-teal-400/20">
          <p className="text-teal-400 text-xs uppercase tracking-widest font-bold mb-2">Your Challenge</p>
          <p className="text-white/80 text-base leading-relaxed">{stop.challenge}</p>
        </div>

        <div className="bg-white/5 rounded-2xl p-5 mb-6 border border-white/10">
          <p className="text-white/50 text-xs uppercase tracking-widest font-bold mb-2">Coordinates</p>
          <p className="text-white font-mono font-black text-xl tracking-wide">
            {stop.lat}, {stop.lng}
          </p>
          <p className="text-white/30 text-xs mt-2">Search these coordinates to find your location.</p>
        </div>

      </div>

      <div className="sticky bottom-4">
        <div className="bg-brand-800/90 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-2xl">
          <p className="text-white/50 text-xs uppercase tracking-widest font-bold mb-3 text-center">
            Enter Unlock Code
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="• • • • • •"
              maxLength={10}
              className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-6 py-4
                text-white font-extrabold text-2xl text-center tracking-[0.4em] uppercase
                placeholder-white/20 focus:outline-none focus:border-teal-400 transition-all"
            />
            <button
              type="submit"
              disabled={loading || code.trim().length < 4}
              className="w-full bg-teal-400 hover:bg-teal-300 disabled:opacity-40
                text-brand-900 font-extrabold text-lg py-4 rounded-2xl transition-all
                flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={20} className="animate-spin" /> Checking...</> : 'Submit Code'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HuntStop;