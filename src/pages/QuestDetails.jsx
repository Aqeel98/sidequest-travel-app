import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useSideQuest } from '../context/SideQuestContext';

const QuestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { quests, acceptQuest, currentUser, questProgress } = useSideQuest();

  const quest = quests.find(q => q.id === id);
  const isAccepted = currentUser && questProgress.some(p => p.traveler_id === currentUser.id && p.quest_id === id);

  if (!quest) return <div>Quest not found</div>;

  const handleAccept = () => {
    const success = acceptQuest(quest.id);
    if (success) navigate('/my-quests');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={() => navigate('/')} className="text-green-600 mb-4">← Back</button>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <img src={quest.image} className="w-full h-80 object-cover" />
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-4">{quest.title}</h1>
          <div className="flex items-center text-gray-600 mb-6">
            <MapPin size={20} className="mr-2" /> {quest.location_address}
          </div>
          
          <div className="bg-yellow-50 p-4 rounded mb-6 border border-yellow-200">
             <h3 className="font-bold">What to Submit</h3>
             <p>{quest.proof_requirements}</p>
          </div>

          {isAccepted ? (
            <div className="bg-green-100 text-green-800 p-4 rounded text-center font-bold">
              ✓ Accepted - Check My Quests
            </div>
          ) : (
            <button onClick={handleAccept} className="w-full bg-green-500 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-600">
              {currentUser ? 'Accept Quest' : 'Login to Accept'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestDetails;