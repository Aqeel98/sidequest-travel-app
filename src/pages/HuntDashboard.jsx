import React, { useEffect, useState, useRef } from 'react';
import { useSideQuest } from '../context/SideQuestContext';
import HuntStopCard from '../components/HuntStopCard';
import HuntCodeModal from '../components/HuntCodeModal';
import { Trophy, CheckCircle2 } from 'lucide-react';

const HuntDashboard = () => {
  const {
    currentUser, activeEvent, isHuntActive, isLoading,
    huntRoute, huntProgress, huntCompletions,
    fetchLeaderboard, fetchHuntData,
  } = useSideQuest();

  const [rank, setRank] = useState(null);
  const [totalTeams, setTotalTeams] = useState(null);

  const hasAccess = activeEvent && currentUser?.hunt_access?.includes(activeEvent.id);

  // ✅ FIX 5 — Screen wake lock
  useEffect(() => {
    let wakeLock = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch (e) {}
    };
    requestWakeLock();
    return () => { if (wakeLock) wakeLock.release(); };
  }, []);

  useEffect(() => {
    if (activeEvent && hasAccess) fetchHuntData(activeEvent.id);
  }, []);

  useEffect(() => {
    if (!activeEvent) return;
    fetchLeaderboard().then(board => {
      setTotalTeams(board.length);
      const myEntry = board.find(e => e.id === currentUser?.id);
      if (myEntry) setRank(myEntry.rank);
    });
  }, [huntProgress?.stops_completed]);

  if (!isHuntActive) {
    return (
      <div className="min-h-screen bg-brand-900 flex items-center justify-center px-6">
        <div className="text-center">
          <Trophy size={48} className="text-teal-300 mx-auto mb-4 opacity-40" />
          <h2 className="text-white font-extrabold text-2xl mb-2">Hunt Starts Soon</h2>
          <p className="text-white/40">Stay tuned — the Colombo Hunt is almost here.</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) return <HuntCodeModal />;

  // ✅ FIX 3 — Loading state
  if (isLoading || (hasAccess && huntRoute.length === 0)) {
    return (
      <div className="min-h-screen bg-brand-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-teal-400/30 border-t-teal-400 animate-spin mx-auto mb-4" />
          <p className="text-white/50 text-sm">Loading your route...</p>
        </div>
      </div>
    );
  }

  const completedStopIds = new Set(huntCompletions.map(c => c.stop_id));
  const activeStepIndex = huntRoute.findIndex(r => !completedStopIds.has(r.stop.id));
  const stopsCompleted = huntProgress?.stops_completed || 0;
  const totalStops = huntRoute.length;
  const isFinished = !!huntProgress?.finished_at;

  return (
    <div className="min-h-screen bg-brand-900 px-4 py-6 max-w-lg mx-auto">

      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-white/50 text-xs uppercase tracking-widest">Team</p>
          <p className="text-white font-extrabold text-xl leading-tight">
            {currentUser?.full_name || 'Your Team'}
          </p>
        </div>
        <div className="flex gap-4 text-right">
          <div>
            <p className="text-teal-300 font-extrabold text-2xl leading-none">{stopsCompleted}/{totalStops}</p>
            <p className="text-white/40 text-xs">Stops</p>
          </div>
          {rank && (
            <div>
              <p className="text-yellow-300 font-extrabold text-2xl leading-none">#{rank}</p>
              <p className="text-white/40 text-xs">Rank</p>
            </div>
          )}
        </div>
      </div>

      {isFinished && (
        <div className="mb-6 p-6 rounded-3xl bg-gradient-to-br from-teal-500/30 to-yellow-500/20 border-2 border-teal-400/50 text-center">
          <CheckCircle2 size={40} className="text-teal-300 mx-auto mb-3" />
          <h2 className="text-white font-extrabold text-2xl mb-1">Race Complete!</h2>
          <p className="text-teal-200 font-bold text-lg">Your Final Rank: #{rank} of {totalTeams}</p>
          <p className="text-white/50 text-sm mt-2">Head to the launch venue for the ceremony 🎉</p>
        </div>
      )}

      {!isFinished && activeStepIndex >= 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-teal-500/10 border border-teal-400/30">
          <p className="text-teal-400 text-xs font-bold uppercase tracking-widest mb-1">
            Current Stop — {activeStepIndex + 1} of {totalStops}
          </p>
          <p className="text-white font-bold">
            {huntRoute[activeStepIndex]?.stop?.title || `Stop ${activeStepIndex + 1}`}
          </p>
          <p className="text-white/50 text-sm mt-1 italic">
            {huntRoute[activeStepIndex]?.stop?.riddle_text?.substring(0, 80)}...
          </p>
        </div>
      )}

      <div className="space-y-3">
        {huntRoute.map((routeRow, index) => {
          const isCompleted = completedStopIds.has(routeRow.stop.id);
          const isActive = index === activeStepIndex;
          return (
            <HuntStopCard
              key={routeRow.id}
              step={index + 1}
              stop={routeRow.stop}
              status={isCompleted ? 'completed' : isActive ? 'active' : 'locked'}
            />
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <a href="/leaderboard" className="text-teal-400 text-sm font-bold underline underline-offset-4">
          View Live Leaderboard →
        </a>
      </div>
    </div>
  );
};

export default HuntDashboard;