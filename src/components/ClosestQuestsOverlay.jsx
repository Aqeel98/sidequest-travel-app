import React from 'react';
import { List, X, MapPin, Compass } from 'lucide-react';
import { useAppPreferences } from '../context/AppPreferencesContext';

const ClosestQuestsOverlay = ({ sortedQuests, onSelectQuest, onClose, locationReady }) => {
  const { theme } = useAppPreferences();
  const isDark = theme === 'dark';
  return (
    // Overlay with Blur
    <div className="fixed inset-0 top-20 bg-black/40 backdrop-blur-sm z-[1500] flex justify-end transition-opacity duration-300">
      
      {/* Slide-out Panel with Animation */}
      <div className={`w-full max-w-md h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300 border-l ${
        isDark ? 'bg-[#0d4b4b]/95 border-cyan-900/60' : 'bg-white/95 border-white/20'
      }`}>
        
        {/* Header Section */}
        <div className={`sticky top-0 backdrop-blur-md z-10 border-b p-6 pb-4 ${
          isDark ? 'bg-[#0d4b4b]/95 border-cyan-900/60' : 'bg-white/95 border-slate-100'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className={`font-extrabold text-xl flex items-center gap-2 ${isDark ? 'text-cyan-50' : 'text-slate-900'}`}>
                <List size={22} className="text-teal-600" />
                Nearby Quests
              </h3>
              
              {/* SMART STATUS: Tells user if GPS is working or using default */}
              <div className="mt-1.5 flex items-center">
                 {locationReady ? (
                   <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-wide">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse mr-1.5"></span>
                      Live GPS Active
                   </span>
                 ) : (
                   <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-wide">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5"></span>
                      Using Default Center
                   </span>
                 )}
              </div>
            </div>

            <button 
              onClick={onClose} 
              className={`p-2 rounded-full transition-all ${isDark ? 'text-cyan-200/80 hover:text-cyan-50 hover:bg-[#0f5c5c]' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'}`}
            >
              <X size={24} />
            </button>
          </div>
        </div>
        
        {/* List Content */}
        <div className="p-6 space-y-4 pb-24">
          {sortedQuests.slice(0, 5).map((q, index) => (
            <div 
              key={q.id} 
              onClick={() => onSelectQuest(q)} 
              className={`group relative p-4 border rounded-2xl shadow-sm hover:shadow-lg hover:scale-[1.01] cursor-pointer transition-all duration-200 ${
                isDark ? 'bg-[#0a3a3a] border-cyan-900/60 hover:border-cyan-700' : 'bg-white border-slate-200 hover:border-teal-300'
              }`}
            >
              {/* Distance Badge */}
              <div className={`absolute top-4 right-4 text-xs font-black transition-colors ${isDark ? 'text-cyan-200/70 group-hover:text-cyan-100' : 'text-slate-400 group-hover:text-teal-600'}`}>
                {q.distance.toFixed(1)} km
              </div>

              {/* Number Badge */}
              <div className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mb-2 transition-colors ${
                isDark ? 'bg-[#0f5c5c] text-cyan-100 group-hover:bg-[#125f5f]' : 'bg-slate-100 text-slate-600 group-hover:bg-teal-50 group-hover:text-teal-700'
              }`}>
                #{index + 1} CLOSEST
              </div>

              <h4 className={`font-bold text-lg leading-tight mb-2 transition-colors ${isDark ? 'text-cyan-50 group-hover:text-cyan-100' : 'text-slate-800 group-hover:text-teal-800'}`}>
                {q.title}
              </h4>

              <div className={`flex justify-between items-center border-t pt-3 mt-2 ${isDark ? 'border-cyan-900/40' : 'border-slate-50'}`}>
                 <span className={`text-xs font-medium flex items-center truncate max-w-[60%] ${isDark ? 'text-cyan-200/80' : 'text-slate-500'}`}>
                    <MapPin size={12} className={`mr-1 ${isDark ? 'text-cyan-200/70' : 'text-slate-400'}`} /> 
                    {q.location_address || "Sri Lanka"}
                 </span>
                 <span className="text-amber-600 text-xs font-extrabold bg-amber-50 px-2 py-1 rounded-lg">
                    ⭐ {q.xp_value} XP
                 </span>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {sortedQuests.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                <Compass size={40} className={`mb-2 animate-spin-slow ${isDark ? 'text-cyan-200/40' : 'text-slate-300'}`} />
                <p className={`text-sm font-medium ${isDark ? 'text-cyan-200/70' : 'text-slate-500'}`}>No quests found nearby.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClosestQuestsOverlay;