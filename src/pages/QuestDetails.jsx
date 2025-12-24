import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Camera, UploadCloud, CheckCircle, Clock, AlertCircle, Navigation } from 'lucide-react';
import { useSideQuest } from '../context/SideQuestContext';

const QuestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { quests, acceptQuest, submitProof, currentUser, questProgress, setShowAuthModal } = useSideQuest();

  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);


  // 1. Find the Quest (Loose equality for ID matching)
  const quest = quests.find(q => q.id == id); 
  
  if (!quest) return <div className="p-10 text-center">Loading Quest...</div>;

  // 2. Determine User Status on this Quest
  const currentProgress = questProgress.find(p => p.traveler_id === currentUser?.id && p.quest_id == id);
  const isStarted = !!currentProgress; 
  const status = currentProgress?.status; // 'in_progress', 'pending', 'approved', 'rejected'

  // --- ACTIONS ---
  const handleOpenMaps = () => {
      if (quest.lat && quest.lng) {
          window.open(`https://www.google.com/maps/dir/?api=1&destination=${quest.lat},${quest.lng}`, '_blank');
      } else {
          window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(quest.location_address)}`, '_blank');
      }
  };

  const handleAccept = async () => {
    // 1. Auth Guard
    if (!currentUser) {
        setShowAuthModal(true);
        return;
    }

    // 2. Double-Click Guard
    if (isAccepting) return;
    setIsAccepting(true); // Start loading

    try {
        await acceptQuest(quest.id);
        // We don't navigate away; the UI will simply update to show the upload form
    } catch (error) {
        alert("Could not join quest. Please try again.");
    } finally {
        setIsAccepting(false); // Stop loading
    }
  };

  // --- PERMANENT FIX: THE SAFETY NET ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return alert("Please upload a photo!");
    
    setIsSubmitting(true); // Button changes to "Uploading..."

    try {
        // 1. Call the Context function
        await submitProof(quest.id, description, selectedFile);
        
        // 2. If it reaches this line, it succeeded. Navigate away.
        navigate('/my-quests');
    } catch (error) {
        // 3. If there is a network error or DB error, it hits here.
        console.error("Submit Error:", error);
        alert("Submission failed. Please check your internet and try again.");
    } finally {
        // 4. ACCURACY FIX: This line runs NO MATTER WHAT.
        // It resets the button so the user is never stuck.
        setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
      <button onClick={() => navigate('/')} className="text-brand-600 mb-4 font-medium flex items-center hover:underline">
        ← Back to Explore
      </button>
      
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* --- HERO IMAGE --- */}
        <div className="relative h-80">
            <img 
              src={quest.image || 'https://via.placeholder.com/800x400/CCCCCC/808080?text=Quest+Image'} 
              className="w-full h-full object-cover" 
              alt={quest.title} 
            />
            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-8">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{quest.title}</h1>
                <div className="flex flex-wrap items-center gap-3 text-white/90">
                    <span className="flex items-center"><MapPin size={18} className="mr-1" /> {quest.location_address}</span>
                    <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">⭐ {quest.xp_value} XP</span>
                </div>
            </div>
        </div>

        <div className="p-8">
          
          {/* --- DIRECTIONS BUTTON --- */}
          <button 
                onClick={handleOpenMaps}
                className="w-full mb-8 bg-blue-50 text-blue-600 border border-blue-200 py-3 rounded-xl font-bold hover:bg-blue-100 transition flex items-center justify-center"
             >
                <Navigation size={18} className="mr-2" /> Get Directions
          </button>

          {/* --- DESCRIPTION BOX --- */}
          <div className="bg-yellow-50 p-6 rounded-2xl mb-8 border border-yellow-200">
             <h3 className="font-bold text-yellow-800 text-lg mb-2">Target Impact</h3>
             <p className="text-yellow-900">{quest.description}</p>
             <div className="mt-4 pt-4 border-t border-yellow-200">
                <h4 className="font-bold text-yellow-800 text-sm">Proof Required:</h4>
                <p className="text-sm text-yellow-900 italic">{quest.proof_requirements || "Upload a photo of your activity."}</p>
             </div>
          </div>

          {/* --- ACTION AREA --- */}
          
          {/* 1. Not Logged In */}
          {!currentUser && (
             <button onClick={() => setShowAuthModal(true)} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition-all">
               Login to Join Quest
             </button>
          )}

          {/* 2. Logged In, Not Started */}
          {currentUser && !isStarted && (
            <button 
                onClick={handleAccept} 
                disabled={isAccepting} // Disable while loading
                className={`w-full text-white py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg ${
                    isAccepting 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-brand-600 hover:bg-brand-700 shadow-brand-200'
                }`}
            >
                {isAccepting ? (
                    'Processing...' 
                ) : (
                    <>Accept Quest <span className="bg-white/20 px-2 py-0.5 rounded text-sm">+ {quest.xp_value} XP</span></>
                )}
            </button>
          )}

          {/* 3. Completed (Approved) */}
          {status === 'approved' && (
            <div className="bg-green-100 text-green-800 p-6 rounded-xl text-center font-bold border border-green-200 flex flex-col items-center">
              <CheckCircle size={48} className="mb-2 text-green-600"/>
              <div>Quest Completed!</div>
              <div className="text-sm font-normal mt-1">You earned {quest.xp_value} XP. Check your profile.</div>
            </div>
          )}

          {/* 4. Pending Review */}
          {status === 'pending' && (
            <div className="bg-blue-50 text-blue-800 p-6 rounded-xl text-center font-bold border border-blue-200 flex flex-col items-center">
              <Clock size={48} className="mb-2 text-blue-500"/>
              <div>Proof Submitted</div>
              <div className="text-sm font-normal mt-1">An admin is reviewing your submission. You will get XP soon!</div>
            </div>
          )}

          {/* 5. In Progress OR Rejected (Retry) */}
          {(status === 'in_progress' || status === 'rejected') && (
            <form onSubmit={handleSubmit} className="border-t pt-6">
                
                {status === 'rejected' && (
                    <div className="mb-6 bg-red-50 p-4 rounded-lg flex items-center text-red-700 border border-red-200">
                        <AlertCircle className="mr-2" />
                        <span>Your previous submission was rejected. Please try again with a clear photo.</span>
                    </div>
                )}

                <h3 className="text-xl font-bold mb-4">Submit Your Proof</h3>
                
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Photo</label>
                    <div className="flex items-center justify-center w-full">
                        <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all ${selectedFile ? 'border-brand-500 bg-brand-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {selectedFile ? (
            <div className="flex flex-col items-center justify-center">
                <div className="relative w-24 h-24 mb-2">
                    <img 
                        src={URL.createObjectURL(selectedFile)} 
                        alt="Preview" 
                        className="w-full h-full object-cover rounded-xl border-2 border-brand-500 shadow-md"
                    />
                    <div className="absolute -top-2 -right-2 bg-brand-600 text-white rounded-full p-1 shadow-lg">
                        <CheckCircle size={16} />
                    </div>
                </div>
                <p className="text-sm text-brand-700 font-bold truncate max-w-[200px]">
                    {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">Click to change photo</p>
            </div>
        ) : (
            <div className="flex flex-col items-center">
                <Camera className="w-10 h-10 mb-3 text-gray-400" />
                <p className="text-sm text-gray-500 font-medium">Click to upload photo evidence</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
            </div>
        )}
                            </div>
                            <input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*" 
                                  onChange={(e) => {
                                 if (selectedFile) URL.revokeObjectURL(selectedFile); // Clean up old preview memory
                                  setSelectedFile(e.target.files[0]);
                              }} 
                            />  
                        </label>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">My Experience (Optional)</label>
                    <textarea 
                        className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                        rows="3"
                        placeholder="I loved helping out here because..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-700 flex items-center justify-center gap-2 shadow-lg transition-all">
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