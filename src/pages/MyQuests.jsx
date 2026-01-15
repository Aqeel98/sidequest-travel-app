import React, { useState, useEffect } from 'react';
import { MapPin, Camera, UploadCloud, CheckCircle, Clock, AlertCircle, Navigation, Loader2, ArrowLeft, XCircle  } from 'lucide-react';
import { useSideQuest } from '../context/SideQuestContext';
import imageCompression from 'browser-image-compression'; 


useEffect(() => {
  // 1. Add the "noindex" tag when entering this page
  const meta = document.createElement('meta');
  meta.name = "robots";
  meta.content = "noindex, nofollow";
  meta.id = "pwa-noindex"; // Give it an ID to find it later
  document.head.appendChild(meta);

  // This ensures your Home and Map pages ARE still indexed!
  return () => {
    const tag = document.getElementById('pwa-noindex');
    if (tag) document.head.removeChild(tag);
  };
}, []);



// --- SUB-COMPONENT: Individual Quest Card ---
const QuestCard = ({ progress, quest, onSubmitProof }) => {
  const [note, setNote] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false); // FIX: New State

  // Cleanup memory for image preview
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // FIX: Compression Logic Added Here
  const handleFileChange = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setIsCompressing(true);

    try {
        const options = {
            maxSizeMB: 0.8,
            maxWidthOrHeight: 1280,
            useWebWorker: false // ✅ FIX: Must be false for Vercel/Mobile
        };
        
        const compressedBlob = await imageCompression(selected, options);
        
        // ✅ FIX: Convert Blob to File so SideQuestContext accepts it
        const compressedFile = new File([compressedBlob], selected.name, { 
            type: selected.type 
        });

        const url = URL.createObjectURL(compressedFile);
        
        setFile(compressedFile);
        setPreview(url);
    } catch (error) {
        console.error("Compression error:", error);
        alert("Could not process image.");
    } finally {
        setIsCompressing(false);
    }
  };

  const handleSubmit = async () => {
    if (!file) return alert("Please upload a proof photo!");
    
    setIsSubmitting(true);
    // Pass the QUEST ID, not the progress ID
    await onSubmitProof(quest.id, note, file);
    setIsSubmitting(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <span className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold uppercase"><CheckCircle size={14} className="mr-1"/> Completed</span>;
      case 'rejected': return <span className="flex items-center text-red-600 bg-red-50 px-3 py-1 rounded-full text-xs font-bold uppercase"><XCircle size={14} className="mr-1"/> Rejected</span>;
      case 'pending': return <span className="flex items-center text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full text-xs font-bold uppercase"><Clock size={14} className="mr-1"/> Under Review</span>;
      default: return <span className="flex items-center text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-xs font-bold uppercase">In Progress</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-xl text-gray-900">{quest.title}</h3>
          <div className="flex items-center text-gray-500 text-sm mt-1">
            <MapPin size={14} className="mr-1" /> {quest.location_address}
          </div>
        </div>
        {getStatusBadge(progress.status)}
      </div>

      {/* --- FORM: Only show if In Progress --- */}
      {(progress.status === 'in_progress' || progress.status === 'rejected') && (
          <div className="mt-4 border-t pt-4 space-y-4">
            {progress.status === 'rejected' && (
                <div className="p-3 bg-red-50 text-red-700 text-[10px] font-bold uppercase rounded-lg border border-red-100">
                  Previous proof rejected. Please upload a clearer photo to resubmit!
                </div>
            )}
          
          {/* 1. Image Upload Area */}
          <div className="flex items-center gap-4">
            {isCompressing ? (
                <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border">
                    <Loader2 className="animate-spin text-brand-500" size={20} />
                </div>
            ) : preview ? (
              <img src={preview} alt="Preview" className="w-16 h-16 object-cover rounded-lg border" />
            ) : (
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                <Camera size={24} />
              </div>
            )}
            
            <label className={`cursor-pointer bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center transition-all ${isCompressing ? 'opacity-50 pointer-events-none' : ''}`}>
              <UploadCloud size={16} className="mr-2" />
              {file ? "Change Photo" : "Upload Proof"}
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
          </div>

          {/* 2. Note Input */}
          <textarea 
            placeholder="Tell us about your experience..." 
            className="w-full border border-gray-200 p-3 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
            rows="2"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          {/* 3. Submit Button */}
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting || isCompressing || !file}
            className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition flex items-center justify-center shadow-lg shadow-brand-100 disabled:opacity-50 disabled:shadow-none"
          >
            {isSubmitting ? 'Uploading...' : 'Submit for Verification'}
          </button>
        </div>
      )}

      {/* --- VIEW MODE --- */}
      {(progress.status === 'pending' || progress.status === 'approved') && (
        <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Your Submission</p>
            <div className="flex gap-4">
                {progress.proof_photo_url && (
                    <img src={progress.proof_photo_url} alt="Proof" className="w-20 h-20 object-cover rounded-lg border" />
                )}
                <p className="text-sm text-gray-600 italic">"{progress.completion_note}"</p>
            </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
const MyQuests = () => {
  const { currentUser, questProgress, quests, submitProof, setShowAuthModal } = useSideQuest();

  if (!currentUser) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Track Your Impact</h2>
            <p className="text-gray-500 mb-6">Login to view your accepted quests and submit proofs.</p>
            <button onClick={() => setShowAuthModal(true)} className="bg-brand-600 text-white px-8 py-3 rounded-full font-bold hover:bg-brand-700 transition shadow-lg">
                Login / Signup
            </button>
        </div>
    );
  }

  // Filter progress for current user
  const myProgress = questProgress.filter(p => p.traveler_id === currentUser.id);

  // Sort: In Progress first, then Pending, then Approved
  const sortedProgress = [...myProgress].sort((a, b) => {
    const order = { 'rejected': 1, 'in_progress': 2, 'pending': 3, 'approved': 4 };
      return order[a.status] - order[b.status];
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-extrabold mb-8 text-gray-900">My Quests</h1>
      
      {sortedProgress.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
              <p className="text-gray-500">You haven't accepted any quests yet.</p>
              <a href="/" className="text-brand-600 font-bold hover:underline mt-2 block">Explore Quests</a>
          </div>
      ) : (
          <div className="space-y-6">
            {sortedProgress.map(progress => {
              const quest = quests.find(q => q.id === progress.quest_id);
              if (!quest) return null; 

              return (
                <QuestCard 
                    key={progress.id} 
                    progress={progress} 
                    quest={quest} 
                    onSubmitProof={submitProof} 
                />
              );
            })}
          </div>
      )}
    </div>
  );
};

export default MyQuests;