import React from 'react';
import { List, X, MapPin, Compass } from 'lucide-react';

const ClosestQuestsOverlay = ({ sortedQuests, onSelectQuest, onClose, locationReady }) => {
  return (
    // Overlay with Blur
    <div className="fixed inset-0 top-16 bg-black/40 backdrop-blur-sm z-[1000] flex justify-end transition-opacity duration-300">
      
      {/* Slide-out Panel with Animation */}
      <div className="w-full max-w-md bg-white/95 h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300 border-l border-white/20">
        
        {/* Header Section */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-10 border-b border-slate-100 p-6 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-extrabold text-xl text-slate-900 flex items-center gap-2">
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
              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all"
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
              className="group relative p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg hover:scale-[1.01] hover:border-teal-300 cursor-pointer transition-all duration-200"
            >
              {/* Distance Badge */}
              <div className="absolute top-4 right-4 text-xs font-black text-slate-400 group-hover:text-teal-600 transition-colors">
                {q.distance.toFixed(1)} km
              </div>

              {/* Number Badge */}
              <div className="inline-block bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md mb-2 group-hover:bg-teal-50 group-hover:text-teal-700 transition-colors">
                #{index + 1} CLOSEST
              </div>

              <h4 className="font-bold text-lg text-slate-800 leading-tight mb-2 group-hover:text-teal-800 transition-colors">
                {q.title}
              </h4>

              <div className="flex justify-between items-center border-t border-slate-50 pt-3 mt-2">
                 <span className="text-slate-500 text-xs font-medium flex items-center truncate max-w-[60%]">
                    <MapPin size={12} className="mr-1 text-slate-400" /> 
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
                <Compass size={40} className="text-slate-300 mb-2 animate-spin-slow" />
                <p className="text-sm font-medium text-slate-500">No quests found nearby.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClosestQuestsOverlay;