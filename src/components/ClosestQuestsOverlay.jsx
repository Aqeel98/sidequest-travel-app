// src/components/ClosestQuestsOverlay.jsx

import React from 'react';
import { List, X, MapPin } from 'lucide-react';

// This component replaces the previous ClosestQuestsList inside MapView.jsx
const ClosestQuestsOverlay = ({ sortedQuests, onSelectQuest, onClose }) => {
  return (
    // Fixed position overlay that covers the entire map area
    <div className="fixed inset-0 top-16 bg-black/50 backdrop-blur-sm z-[1000] flex justify-end">
      
      {/* Slide-out List Panel */}
      <div className="w-full max-w-md bg-white p-6 shadow-2xl overflow-y-auto">
        
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h3 className="font-extrabold text-xl text-gray-900 flex items-center">
            <List size={24} className="mr-3 text-brand-600" />
            5 Closest Quests
          </h3>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-4">
          {sortedQuests.slice(0, 5).map((q, index) => (
            <div 
              key={q.id} 
              onClick={() => onSelectQuest(q)} 
              className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md cursor-pointer hover:border-brand-300 transition-all"
            >
              <p className="text-xs font-semibold text-brand-600 mb-1">
                {index + 1}. {q.distance.toFixed(1)} km Away
              </p>
              <p className="font-bold text-lg text-gray-900">{q.title}</p>
              <div className="flex justify-between items-center text-sm mt-2">
                 <span className="text-gray-500 flex items-center"><MapPin size={14} className="mr-1" /> {q.location_address}</span>
                 <span className="text-orange-500 font-bold">⭐ {q.xp_value} XP</span>
              </div>
            </div>
          ))}
          {sortedQuests.length === 0 && <p className="text-sm text-gray-500 pt-4">No geolocated quests found.</p>}
        </div>
      </div>
    </div>
  );
};

export default ClosestQuestsOverlay;