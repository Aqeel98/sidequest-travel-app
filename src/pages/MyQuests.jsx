import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { useSideQuest } from '../context/SideQuestContext';

const MyQuests = () => {
  const { currentUser, questProgress, quests, submitProof, setShowAuthModal } = useSideQuest();
  const [notes, setNotes] = useState({});

  if (!currentUser) {
    return (
        <div className="text-center mt-20">
            <h2 className="text-xl mb-4">Please login to view quests</h2>
            <button onClick={()=>setShowAuthModal(true)} className="bg-green-500 text-white px-4 py-2 rounded">Login</button>
        </div>
    );
  }

  const myProgress = questProgress.filter(p => p.traveler_id === currentUser.id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Quests</h1>
      <div className="space-y-6">
        {myProgress.map(progress => {
          const quest = quests.find(q => q.id === progress.quest_id);
          return (
            <div key={progress.id} className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-xl">{quest.title}</h3>
              <div className="text-sm mb-4">Status: <span className="uppercase font-bold text-green-600">{progress.status.replace('_', ' ')}</span></div>
              
              {progress.status === 'in_progress' && (
                <div className="mt-4 border-t pt-4">
                  <textarea 
                    placeholder="Describe what you did..." 
                    className="w-full border p-2 rounded mb-2"
                    onChange={(e) => setNotes({...notes, [progress.id]: e.target.value})}
                  />
                  <button onClick={() => submitProof(progress.id, notes[progress.id])} className="bg-green-500 text-white px-4 py-2 rounded flex items-center">
                    <Camera size={18} className="mr-2" /> Submit Proof
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyQuests;