import React, { useEffect, useState } from 'react';
import { useSideQuest } from '../context/SideQuestContext';
import { Trophy, Medal, Clock, Zap, RefreshCw } from 'lucide-react';
import { supabase } from '../supabaseClient';

const Leaderboard = () => {
  const { activeEvent, fetchLeaderboard } = useSideQuest();
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBoard = async () => {
    setLoading(true);
    const data = await fetchLeaderboard();
    setBoard(data);
    setLoading(false);
  };

  useEffect(() => {
    loadBoard();

    if (!activeEvent) return;
    const channel = supabase
      .channel('leaderboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hunt_progress' }, () => {
        loadBoard();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [activeEvent]);

  const formatTime = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' });
  };

  const rankColors = ['text-yellow-300', 'text-slate-300', 'text-amber-500'];

  return (
    <div className="min-h-screen bg-brand-900 px-4 py-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-teal-400 text-xs uppercase tracking-widest font-bold">Live Standings</p>
          <h1 className="text-white font-extrabold text-3xl">Leaderboard</h1>
        </div>
        <button
          onClick={loadBoard}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {board.map((team, i) => (
            <div
              key={team.id}
              className={`
                flex items-center gap-4 p-4 rounded-2xl border transition-all
                ${i === 0 ? 'border-yellow-400/30 bg-yellow-500/10'
                  : i === 1 ? 'border-slate-400/20 bg-white/5'
                  : i === 2 ? 'border-amber-500/20 bg-amber-500/5'
                  : 'border-white/5 bg-white/3'}
              `}
            >
              <div className={`w-8 text-center font-extrabold text-lg ${rankColors[i] || 'text-white/40'}`}>
                {i < 3 ? <Medal size={20} className="mx-auto" /> : `#${team.rank}`}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white font-bold truncate">{team.team_name}</p>
                <p className="text-white/40 text-xs">
                  {team.stops_completed} stops · {team.xp_earned} XP
                </p>
              </div>

              <div className="text-right flex-shrink-0">
                {team.finished_at ? (
                  <div className="flex items-center gap-1 text-teal-300 text-sm font-bold">
                    <Clock size={13} />
                    {formatTime(team.finished_at)}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-white/30 text-sm">
                    <Zap size={13} />
                    {team.stops_completed}/10
                  </div>
                )}
              </div>
            </div>
          ))}

          {board.length === 0 && (
            <div className="text-center py-12 text-white/30">
              <Trophy size={40} className="mx-auto mb-3 opacity-20" />
              <p>No teams racing yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;