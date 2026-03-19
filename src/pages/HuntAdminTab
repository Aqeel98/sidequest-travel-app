import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
  Trophy, Plus, Trash2, ToggleLeft, ToggleRight,
  MapPin, RefreshCw, ChevronDown, ChevronUp, Eye, EyeOff
} from 'lucide-react';

const HuntAdminTab = ({ showToast }) => {
  const [event, setEvent] = useState(null);
  const [stops, setStops] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [showAddStop, setShowAddStop] = useState(false);
  const [showCodes, setShowCodes] = useState(false);
  const [expandedStop, setExpandedStop] = useState(null);

  const [stopForm, setStopForm] = useState({
    title: '', riddle_text: '', lat: '', lng: '',
    challenge: '', partner_name: '', unlock_code: '',
    xp_value: 50, is_finish: false
  });

  const EVENT_ID = 'colombo-hunt-may-2025';

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [{ data: ev }, { data: st }, { data: lb }] = await Promise.all([
        supabase.from('events').select('*').eq('id', EVENT_ID).maybeSingle(),
        supabase.from('hunt_stops').select('*').eq('event_id', EVENT_ID).order('title'),
        supabase.from('view_hunt_leaderboard').select('*').eq('event_id', EVENT_ID).order('rank'),
      ]);
      if (ev) setEvent(ev);
      if (st) setStops(st);
      if (lb) setLeaderboard(lb);
    } catch (e) {
      showToast('Failed to load hunt data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const toggleActive = async () => {
    if (!event) return;
    setToggling(true);
    try {
      const { error } = await supabase
        .from('events')
        .update({ is_active: !event.is_active })
        .eq('id', EVENT_ID);
      if (error) throw error;
      setEvent(prev => ({ ...prev, is_active: !prev.is_active }));
      showToast(
        event.is_active ? 'Hunt is now OFFLINE' : '🏁 Hunt is now LIVE!',
        event.is_active ? 'info' : 'success'
      );
    } catch (e) {
      showToast('Toggle failed: ' + e.message, 'error');
    } finally {
      setToggling(false);
    }
  };

  const handleAddStop = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('hunt_stops')
        .insert([{
          event_id: EVENT_ID,
          title: stopForm.title,
          riddle_text: stopForm.riddle_text,
          lat: parseFloat(stopForm.lat),
          lng: parseFloat(stopForm.lng),
          challenge: stopForm.challenge,
          partner_name: stopForm.partner_name || null,
          unlock_code: stopForm.unlock_code.toUpperCase(),
          xp_value: parseInt(stopForm.xp_value) || 50,
          is_finish: stopForm.is_finish,
        }])
        .select()
        .single();
      if (error) throw error;
      setStops(prev => [...prev, data]);
      setStopForm({
        title: '', riddle_text: '', lat: '', lng: '',
        challenge: '', partner_name: '', unlock_code: '',
        xp_value: 50, is_finish: false
      });
      setShowAddStop(false);
      showToast('Stop added! Now add it to hunt_routes via SQL.', 'success');
    } catch (e) {
      showToast('Failed to add stop: ' + e.message, 'error');
    }
  };

  const handleDeleteStop = async (id) => {
    if (!window.confirm('Delete this stop? This will also remove it from all routes.')) return;
    try {
      const { error } = await supabase.from('hunt_stops').delete().eq('id', id);
      if (error) throw error;
      setStops(prev => prev.filter(s => s.id !== id));
      showToast('Stop deleted.', 'info');
    } catch (e) {
      showToast('Delete failed: ' + e.message, 'error');
    }
  };

  const resetRace = async () => {
    if (!window.confirm('This will reset ALL team progress. Are you sure?')) return;
    try {
      const { error } = await supabase.rpc('admin_reset_hunt', {
        event_id_input: EVENT_ID
      });
      if (error) throw error;
      setLeaderboard([]);
      showToast('Race reset. All progress cleared.', 'info');
    } catch (e) {
      showToast('Reset failed: ' + e.message, 'error');
    }
  };

  const formatTime = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw size={24} className="animate-spin text-teal-600 mr-3" />
        <span className="text-gray-500">Loading hunt data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">

      {/* ── EVENT CONTROL CARD ── */}
      <div className={`rounded-3xl border-2 p-6 ${event?.is_active ? 'bg-teal-50 border-teal-300' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Trophy size={24} className={event?.is_active ? 'text-teal-600' : 'text-gray-400'} />
              <h2 className="text-2xl font-black text-gray-900">{event?.name || 'Unlock Colombo'}</h2>
              <span className={`text-xs font-black px-3 py-1 rounded-full border ${
                event?.is_active
                  ? 'bg-teal-100 text-teal-700 border-teal-300'
                  : 'bg-gray-100 text-gray-500 border-gray-200'
              }`}>
                {event?.is_active ? '🟢 LIVE' : '⚫ OFFLINE'}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Access Code: <span className="font-black text-gray-800 tracking-widest">{event?.access_code}</span>
              &nbsp;·&nbsp;
              {stops.length} stops configured
              &nbsp;·&nbsp;
              {leaderboard.length} teams registered
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={fetchAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-all"
            >
              <RefreshCw size={16} /> Refresh
            </button>
            <button
              onClick={toggleActive}
              disabled={toggling || !event}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-md ${
                event?.is_active
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-teal-600 hover:bg-teal-700 text-white'
              } disabled:opacity-50`}
            >
              {event?.is_active
                ? <><ToggleRight size={18} /> Stop Hunt</>
                : <><ToggleLeft size={18} /> Go Live</>
              }
            </button>
          </div>
        </div>

        {event?.is_active && (
          <div className="mt-4 p-4 bg-teal-100 rounded-2xl border border-teal-200">
            <p className="text-teal-800 font-bold text-sm">
              🏁 Hunt is LIVE — announce access code <span className="font-black tracking-widest">{event.access_code}</span> to captains.
              Monitor the leaderboard below. No approval actions needed during the race.
            </p>
          </div>
        )}
      </div>

      {/* ── LIVE LEADERBOARD ── */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-black text-gray-900">Live Leaderboard</h3>
          <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
            {leaderboard.length} teams
          </span>
        </div>

        {leaderboard.length === 0 ? (
          <p className="text-center text-gray-400 py-8 border border-dashed rounded-2xl text-sm">
            No teams have entered the access code yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 text-xs font-black text-gray-500 uppercase">Rank</th>
                  <th className="text-left py-2 px-3 text-xs font-black text-gray-500 uppercase">Team</th>
                  <th className="text-left py-2 px-3 text-xs font-black text-gray-500 uppercase">Stops</th>
                  <th className="text-left py-2 px-3 text-xs font-black text-gray-500 uppercase">XP</th>
                  <th className="text-left py-2 px-3 text-xs font-black text-gray-500 uppercase">Finished</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((team, i) => (
                  <tr key={team.id} className={`border-b last:border-0 ${i === 0 ? 'bg-yellow-50' : ''}`}>
                    <td className="py-3 px-3">
                      <span className={`font-black text-lg ${
                        i === 0 ? 'text-yellow-500' :
                        i === 1 ? 'text-gray-400' :
                        i === 2 ? 'text-orange-400' : 'text-gray-400'
                      }`}>#{team.rank}</span>
                    </td>
                    <td className="py-3 px-3 font-bold text-gray-900">{team.team_name}</td>
                    <td className="py-3 px-3">
                      <span className="font-black text-teal-600">{team.stops_completed}</span>
                      <span className="text-gray-400">/{stops.length || 10}</span>
                    </td>
                    <td className="py-3 px-3 font-bold text-gray-700">{team.xp_earned} XP</td>
                    <td className="py-3 px-3">
                      {team.finished_at ? (
                        <span className="bg-teal-100 text-teal-700 px-2 py-1 rounded-full text-xs font-black">
                          ✓ {formatTime(team.finished_at)}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Racing...</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── HUNT STOPS ── */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-black text-gray-900">Hunt Stops ({stops.length}/10)</h3>
            <p className="text-sm text-gray-500 mt-0.5">Configure the 10 physical locations for the race.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCodes(!showCodes)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold hover:bg-gray-200 transition-all"
            >
              {showCodes ? <EyeOff size={16} /> : <Eye size={16} />}
              {showCodes ? 'Hide Codes' : 'Show Codes'}
            </button>
            <button
              onClick={() => setShowAddStop(!showAddStop)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-bold hover:bg-teal-700 transition-all"
            >
              <Plus size={16} /> Add Stop
            </button>
          </div>
        </div>

        {/* Add Stop Form */}
        {showAddStop && (
          <form onSubmit={handleAddStop} className="mb-6 p-5 bg-teal-50 rounded-2xl border border-teal-200 space-y-4">
            <h4 className="font-black text-teal-800">New Hunt Stop</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Stop Title *</label>
                <input required value={stopForm.title} onChange={e => setStopForm(p => ({...p, title: e.target.value}))}
                  placeholder="e.g. The Regulars Hideout"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-teal-400 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Partner / Venue Name</label>
                <input value={stopForm.partner_name} onChange={e => setStopForm(p => ({...p, partner_name: e.target.value}))}
                  placeholder="e.g. Barista & Co"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-teal-400 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Latitude *</label>
                <input required type="number" step="any" value={stopForm.lat} onChange={e => setStopForm(p => ({...p, lat: e.target.value}))}
                  placeholder="6.9271"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-teal-400 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Longitude *</label>
                <input required type="number" step="any" value={stopForm.lng} onChange={e => setStopForm(p => ({...p, lng: e.target.value}))}
                  placeholder="79.8612"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-teal-400 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Unlock Code * (6 characters)</label>
                <input required maxLength={10} value={stopForm.unlock_code}
                  onChange={e => setStopForm(p => ({...p, unlock_code: e.target.value.toUpperCase()}))}
                  placeholder="SQ7F3X"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono tracking-widest uppercase focus:border-teal-400 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">XP Value</label>
                <input type="number" value={stopForm.xp_value} onChange={e => setStopForm(p => ({...p, xp_value: e.target.value}))}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-teal-400 outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-600 mb-1">Riddle Text * (shown to captain)</label>
                <textarea required rows={2} value={stopForm.riddle_text} onChange={e => setStopForm(p => ({...p, riddle_text: e.target.value}))}
                  placeholder="Cryptic clue that leads the team to this location..."
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-teal-400 outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-600 mb-1">Challenge * (what the team must do)</label>
                <textarea required rows={2} value={stopForm.challenge} onChange={e => setStopForm(p => ({...p, challenge: e.target.value}))}
                  placeholder="Order a coffee and take a team photo..."
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-teal-400 outline-none" />
              </div>
              <div className="md:col-span-2 flex items-center gap-3">
                <input type="checkbox" id="is_finish" checked={stopForm.is_finish}
                  onChange={e => setStopForm(p => ({...p, is_finish: e.target.checked}))}
                  className="w-4 h-4 accent-teal-600" />
                <label htmlFor="is_finish" className="text-sm font-bold text-gray-700">
                  This is the Finish Stop (launch venue — Step 10 for all routes)
                </label>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowAddStop(false)}
                className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 text-sm font-bold">Cancel</button>
              <button type="submit"
                className="px-6 py-2 rounded-xl bg-teal-600 text-white text-sm font-bold hover:bg-teal-700">
                Add Stop
              </button>
            </div>
          </form>
        )}

        {/* Stop List */}
        {stops.length === 0 ? (
          <p className="text-center text-gray-400 py-8 border border-dashed rounded-2xl text-sm">
            No stops added yet. Click "Add Stop" to configure your hunt locations.
          </p>
        ) : (
          <div className="space-y-3">
            {stops.map((stop, index) => (
              <div key={stop.id} className={`rounded-2xl border-2 overflow-hidden ${stop.is_finish ? 'border-yellow-300 bg-yellow-50' : 'border-gray-100'}`}>
                <div
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={() => setExpandedStop(expandedStop === stop.id ? null : stop.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${stop.is_finish ? 'bg-yellow-400 text-white' : 'bg-teal-100 text-teal-700'}`}>
                      {stop.is_finish ? '🏁' : index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{stop.title}</p>
                      <p className="text-xs text-gray-400">
                        {stop.partner_name && `${stop.partner_name} · `}
                        {stop.lat}, {stop.lng}
                        {stop.is_finish && ' · FINISH STOP'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {showCodes && (
                      <span className="font-mono font-black text-teal-700 bg-teal-50 px-3 py-1 rounded-lg border border-teal-200 text-sm tracking-widest">
                        {stop.unlock_code}
                      </span>
                    )}
                    <span className="text-xs font-bold text-gray-400">{stop.xp_value} XP</span>
                   
                    {expandedStop === stop.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>

                {expandedStop === stop.id && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3 bg-white">
                    <div>
                      <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Riddle</p>
                      <p className="text-sm text-gray-700 italic">"{stop.riddle_text}"</p>
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Challenge</p>
                      <p className="text-sm text-gray-700">{stop.challenge}</p>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Unlock Code</p>
                        <p className="font-mono font-black text-teal-700 tracking-widest">{stop.unlock_code}</p>
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Stop ID</p>
                        <p className="font-mono text-xs text-gray-400">{stop.id}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── DANGER ZONE ── */}
      <div className="bg-white rounded-3xl border-2 border-red-100 p-6">
        <h3 className="text-lg font-black text-red-600 mb-2">Danger Zone</h3>
        <p className="text-sm text-gray-500 mb-4">
          Reset all team progress — clears hunt_completions, hunt_progress, and hunt_access for all captains.
          Use this between test runs or if you need to restart the race from scratch.
        </p>
        <button
          onClick={resetRace}
          className="px-6 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-all"
        >
          Reset All Race Progress
        </button>
      </div>

    </div>
  );
};

export default HuntAdminTab;