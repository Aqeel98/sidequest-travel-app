import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Camera, UploadCloud } from 'lucide-react';
import { useSideQuest } from '../context/SideQuestContext';

const QuestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { quests, acceptQuest, submitProof, currentUser, questProgress, setShowAuthModal } = useSideQuest();

  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const quest = quests.find(q => q.id == id); // Use loose equality for string/number id mismatch
  
  if (!quest) return <div className="p-10 text-center">Loading Quest... (If stuck, go back home)</div>;

  const isAccepted = currentUser && questProgress.some(p => p.traveler_id === currentUser.id && p.quest_id == id);
  const currentProgress = questProgress.find(p => p.traveler_id === currentUser?.id && p.quest_id == id);
  const isSubmitted = currentProgress?.status === 'pending' || currentProgress?.status === 'approved';

  const handleAccept = async () => {
    if (!currentUser) {
        setShowAuthModal(true);
        return;
    }
    await acceptQuest(quest.id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return alert("Please upload a photo!");
    
    setIsSubmitting(true);
    await submitProof(quest.id, description, selectedFile);
    setIsSubmitting(false);
    navigate('/my-quests');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
      <button onClick={() => navigate('/')} className="text-brand-600 mb-4 font-medium">← Back to Explore</button>
      
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="relative h-80">
            <img src={quest.image || 'https://via.placeholder.com/800x400'} className="w-full h-full object-cover" alt={quest.title} />
            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-8">
                <h1 className="text-4xl font-bold text-white mb-2">{quest.title}</h1>
                <div className="flex items-center text-white/90">
                    <MapPin size={20} className="mr-2" /> {quest.location_address}
                </div>
            </div>
        </div>

        <div className="p-8">
          <div className="bg-yellow-50 p-6 rounded-2xl mb-8 border border-yellow-200">
             <h3 className="font-bold text-yellow-800 text-lg mb-2">Target Impact</h3>
             <p className="text-yellow-900">{quest.proof_requirements || quest.description}</p>
          </div>

          {!currentUser ? (
             <button onClick={() => setShowAuthModal(true)} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition-all">
               Login to Join Quest
             </button>
          ) : !isAccepted ? (
            <button onClick={handleAccept} className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-700 shadow-lg shadow-brand-200 transition-all">
              Accept Quest (+{quest.xp_value} XP)
            </button>
          ) : isSubmitted ? (
            <div className="bg-green-100 text-green-800 p-6 rounded-xl text-center font-bold border border-green-200">
              <div className="text-4xl mb-2">🎉</div>
              Proof Submitted! waiting for Admin verification.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="border-t pt-6">
                <h3 className="text-xl font-bold mb-4">Complete this Quest</h3>
                
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Proof (Photo)</label>
                    <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                {selectedFile ? (
                                    <p className="text-sm text-green-600 font-bold">{selectedFile.name}</p>
                                ) : (
                                    <>
                                        <Camera className="w-8 h-8 mb-3 text-gray-400" />
                                        <p className="text-sm text-gray-500">Click to upload photo</p>
                                    </>
                                )}
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => setSelectedFile(e.target.files[0])} />
                        </label>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">My Experience (Optional)</label>
                    <textarea 
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        rows="3"
                        placeholder="I loved helping out here because..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 flex items-center justify-center gap-2">
                    {isSubmitting ? 'Uploading...' : <><UploadCloud size={20}/> Submit Proof</>}
                </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestDetails;