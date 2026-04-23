import React, { useState, useEffect } from 'react';
import { MapPin, Camera, UploadCloud, CheckCircle, Clock, AlertCircle, Navigation, Loader2, ArrowLeft, XCircle  } from 'lucide-react';
import { useSideQuest } from '../context/SideQuestContext';
import imageCompression from 'browser-image-compression'; 
import { useAppPreferences } from '../context/AppPreferencesContext';




// --- SUB-COMPONENT: Individual Quest Card ---
const QuestCard = ({ progress, quest, onSubmitProof }) => {
  const { theme } = useAppPreferences();
  const isDark = theme === 'dark';
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
            useWebWorker: false // Must be false for Vercel/Mobile
        };
        
        const compressedBlob = await imageCompression(selected, options);
        
        // Convert Blob to File so SideQuestContext accepts it
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
    // 1. Convert optimized file to Base64 String
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
        const payload = {
            questId: quest.id,
            note: note,
            imageString: reader.result,
            type: 'proof_submission'
        };
        // 2. Save and Refresh
        localStorage.setItem('sq_auto_proof', JSON.stringify(payload));
        window.location.reload();
    };
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
    <div className={`rounded-2xl shadow-sm border p-6 transition hover:shadow-md ${isDark ? 'bg-[#0d4b4b] border-cyan-900/60 text-cyan-50' : 'bg-white border-gray-100'}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className={`font-bold text-xl ${isDark ? 'text-cyan-50' : 'text-gray-900'}`}>{quest.title}</h3>
          <div className={`flex items-center text-sm mt-1 ${isDark ? 'text-cyan-100/80' : 'text-gray-500'}`}>
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
            className={`w-full border p-3 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none ${isDark ? 'border-cyan-900/60 bg-[#0a3a3a] text-cyan-50' : 'border-gray-200'}`}
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
        <div className={`mt-4 p-4 rounded-xl border ${isDark ? 'bg-[#0a3a3a] border-cyan-900/50' : 'bg-gray-50 border-gray-100'}`}>
            <p className={`text-xs font-bold uppercase mb-2 ${isDark ? 'text-cyan-200/80' : 'text-gray-500'}`}>Your Submission</p>
            <div className="flex gap-4">
                {progress.proof_photo_url && (
                    <img src={progress.proof_photo_url} alt="Proof" className="w-20 h-20 object-cover rounded-lg border" />
                )}
                <p className={`text-sm italic ${isDark ? 'text-cyan-100/80' : 'text-gray-600'}`}>"{progress.completion_note}"</p>
            </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
const MyQuests = () => {
  const { currentUser, questProgress, quests, submitProof, setShowAuthModal, showToast, questSuggestions } = useSideQuest();
  const { theme } = useAppPreferences();
  const isDark = theme === 'dark';

  useEffect(() => {
    const pendingProof = localStorage.getItem('sq_auto_proof');
    if (pendingProof && currentUser) {
        const resume = async () => {
            const { questId, note, imageString } = JSON.parse(pendingProof);
            localStorage.removeItem('sq_auto_proof'); // Clear immediately
            
            try {
                // Convert string back to file
                const res = await fetch(imageString);
                const blob = await res.blob();
                const file = new File([blob], "proof.jpg", { type: "image/jpeg" });
                
                await submitProof(questId, note, file);
                // Success toast is handled by Context
            } catch (e) {
                console.error("Auto-proof failed", e);
            }
        };
        resume();
    }
  }, [currentUser]);


  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    meta.id = "pwa-noindex";
    document.head.appendChild(meta);

    return () => {
      const tag = document.getElementById('pwa-noindex');
      if (tag) document.head.removeChild(tag);
    };
  }, []);


  if (!currentUser) {
    return (
        <div className={`flex flex-col items-center justify-center min-h-[60vh] text-center px-4 ${isDark ? 'text-cyan-50' : ''}`}>
            <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-cyan-50' : 'text-gray-800'}`}>Track Your Impact</h2>
            <p className={`mb-6 ${isDark ? 'text-cyan-200/80' : 'text-gray-500'}`}>Login to view your accepted quests and submit proofs.</p>
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
 
    if (order[a.status] !== order[b.status]) {
        return order[a.status] - order[b.status];
    }
    return b.id - a.id; 
});

  return (
    <div className={`max-w-3xl mx-auto px-4 py-8 ${isDark ? 'text-cyan-50' : ''}`}>
      <h1 className={`text-3xl font-extrabold mb-8 ${isDark ? 'text-cyan-50' : 'text-gray-900'}`}>My Quests</h1>
      
      {sortedProgress.length === 0 ? (
          <div className={`text-center py-12 rounded-2xl border border-dashed ${isDark ? 'bg-[#0d4b4b] border-cyan-900/60' : 'bg-white border-gray-300'}`}>
              <p className={isDark ? 'text-cyan-100/80' : 'text-gray-500'}>You haven't accepted any quests yet.</p>
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
    {/* --- MY QUEST SUGGESTIONS --- */}
    <div className="mt-12">
        <h2 className={`text-2xl font-extrabold mb-6 ${isDark ? 'text-cyan-50' : 'text-gray-900'}`}>My Quest Suggestions</h2>

        {questSuggestions.length === 0 ? (
          <div className={`text-center py-12 rounded-2xl border border-dashed ${isDark ? 'bg-[#0d4b4b] border-cyan-900/60' : 'bg-white border-gray-300'}`}>
            <div className="mb-3 flex justify-center"><MapPin size={40} className={isDark ? 'text-cyan-200/40' : 'text-gray-300'} /></div>
            <p className={`font-medium ${isDark ? 'text-cyan-100/85' : 'text-gray-500'}`}>You haven't suggested any quests yet.</p>
            <p className={`text-sm mt-1 ${isDark ? 'text-cyan-200/70' : 'text-gray-400'}`}>Use the map to suggest a hidden gem. Earn 50 XP if approved!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questSuggestions.map(s => (
              <div key={s.id} className={`rounded-2xl shadow-sm border p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:shadow-md ${isDark ? 'bg-[#0d4b4b] border-cyan-900/60' : 'bg-white border-gray-100'}`}>
                <div className="flex gap-4 items-start">
                  {s.photo_url ? (
                    <img src={s.photo_url} alt={s.quest_name} className={`w-16 h-16 object-cover rounded-xl border flex-shrink-0 ${isDark ? 'border-cyan-900/50' : 'border-gray-100'}`} />
                  ) : (
                    <div className={`w-16 h-16 rounded-xl border border-dashed flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-[#0a3a3a] border-cyan-900/50 text-cyan-200/40' : 'bg-gray-50 border-gray-200 text-gray-300'}`}><MapPin size={24} /></div>
                  )}
                  <div>
                    <h3 className={`font-bold text-lg leading-tight ${isDark ? 'text-cyan-50' : 'text-gray-900'}`}>{s.quest_name}</h3>
                    <p className={`text-sm mt-1 line-clamp-2 ${isDark ? 'text-cyan-200/80' : 'text-gray-500'}`}>{s.description}</p>
                    {s.maps_link && (
                      <a href={s.maps_link} target="_blank" rel="noreferrer" className="text-xs font-bold mt-1 inline-block underline" style={{ color: '#107870' }}>
                        View on Maps →
                      </a>
                    )}
                    <p className={`text-xs mt-2 ${isDark ? 'text-cyan-200/65' : 'text-gray-400'}`}>{new Date(s.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {s.status === 'pending' && (
                    <span className="flex items-center gap-1 bg-yellow-50 text-yellow-600 border border-yellow-200 px-3 py-1.5 rounded-full text-xs font-black uppercase">
                      <Clock size={12} /> Under Review
                    </span>
                  )}
                  {s.status === 'approved' && (
                    <div className="text-center">
                      <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-black uppercase">
                         Approved
                      </span>
                      <p className="text-xs font-black text-emerald-500 mt-1">+50 XP Awarded!</p>
                    </div>
                  )}
                  {s.status === 'rejected' && (
                    <span className="flex items-center gap-1 bg-red-50 text-red-500 border border-red-200 px-3 py-1.5 rounded-full text-xs font-black uppercase">
                      <XCircle size={12} /> Not Approved
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default MyQuests;