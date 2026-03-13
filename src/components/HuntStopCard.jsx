import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle, MapPin } from 'lucide-react';

const HuntStopCard = ({ step, stop, status }) => {
  // status: 'completed' | 'active' | 'locked'
  const navigate = useNavigate();

  const handleTap = () => {
    if (status === 'active') navigate(`/hunt/${stop.id}`);
  };

  return (
    <div
      onClick={handleTap}
      className={`
        flex items-center gap-4 p-4 rounded-2xl border-2 transition-all
        ${status === 'completed'
          ? 'border-emerald-500/40 bg-emerald-900/20 opacity-80'
          : status === 'active'
            ? 'border-teal-400 bg-brand-900/60 cursor-pointer shadow-lg shadow-teal-500/20 animate-pulse-slow'
            : 'border-white/10 bg-white/5 opacity-40 cursor-not-allowed'
        }
      `}
    >
      <div className={`
        w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-extrabold
        ${status === 'completed' ? 'bg-emerald-500 text-white'
          : status === 'active' ? 'bg-teal-400 text-brand-900'
          : 'bg-white/10 text-white/40'}
      `}>
        {status === 'completed' ? <CheckCircle size={18} /> : step}
      </div>

      <div className="flex-1 min-w-0">
        {status === 'locked' ? (
          <p className="text-white/30 text-sm font-semibold">Stop {step} — Locked</p>
        ) : (
          <>
            <p className={`font-bold text-sm truncate ${status === 'active' ? 'text-teal-300' : 'text-emerald-300'}`}>
              {stop?.title || `Stop ${step}`}
            </p>
            {stop?.partner_name && (
              <p className="text-white/50 text-xs">{stop.partner_name}</p>
            )}
          </>
        )}
      </div>

      <div className="flex-shrink-0">
        {status === 'locked' ? (
          <Lock size={16} className="text-white/20" />
        ) : status === 'active' ? (
          <MapPin size={16} className="text-teal-400" />
        ) : (
          <CheckCircle size={16} className="text-emerald-400" />
        )}
      </div>
    </div>
  );
};

export default HuntStopCard;