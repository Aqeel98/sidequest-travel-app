import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Camera, UploadCloud, CheckCircle, Clock, AlertCircle, Navigation, Loader2, ArrowLeft } from 'lucide-react';
import { useSideQuest } from '../context/SideQuestContext';
import imageCompression from 'browser-image-compression'; // THE 4G FIX

const QuestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { quests, acceptQuest, submitProof, currentUser, questProgress, setShowAuthModal, showToast } = useSideQuest();

  // State
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

// --- HELPER: CONVERT MARKDOWN LINKS [text](url) TO CLICKABLE LINKS ---
const LinkifyText = ({ text }) => {
  if (!text) return null;

  const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = markdownLinkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(
      <a 
        key={match.index}
        href={match[2]} 
        target="_blank" 
        rel="noreferrer" 
        className="text-blue-600 underline font-bold hover:text-blue-800"
      >
        {match[1]}
      </a>
    );
    lastIndex = markdownLinkRegex.lastIndex;
  }
  
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <span className="whitespace-pre-line">{parts.length > 0 ? parts : text}</span>;
};
  
  // 1. SAFE LOOKUP
  const questId = Number(id);
  const quest = useMemo(() => quests.find(q => q.id === questId), [quests, questId]);
  
  // 2. Determine Status
  const currentProgress = useMemo(() => 
    questProgress.find(p => p.traveler_id === currentUser?.id && p.quest_id === questId),
    [questProgress, currentUser, questId]
  );
  const isStarted = !!currentProgress; 
  const status = currentProgress?.status; 

// --- HELPER: CATEGORY COLORS ---
const getCategoryColor = (cat) => {
  if (cat === 'Adventure') return 'bg-orange-100 text-orange-800';
  if (cat === 'Exploration') return 'bg-yellow-100 text-yellow-800';
  if (cat === 'Cultural') return 'bg-violet-100 text-violet-800';
  if (cat === 'Marine Adventure') return 'bg-cyan-100 text-cyan-800';
  if (cat === 'Wildlife Adventure') return 'bg-lime-100 text-lime-800';
  if (cat === 'Environmental') return 'bg-emerald-100 text-emerald-800';
  if (cat === 'Social') return 'bg-rose-100 text-rose-800';
  if (cat === 'Education') return 'bg-blue-100 text-blue-800';
  if (cat === 'Animal Welfare') return 'bg-pink-100 text-pink-800';
  return 'bg-gray-100 text-gray-800';
};

    useEffect(() => {
    window.scrollTo(0, 0);
    }, []);


    useEffect(() => {
      const pendingProof = localStorage.getItem('sq_auto_proof');
      if (pendingProof && currentUser) {
          const resume = async () => {
              const { questId, note, imageString } = JSON.parse(pendingProof);
              // Only resume if we are on the correct quest page or handle globally
              if (Number(id) === questId) {
                  localStorage.removeItem('sq_auto_proof');
                  setIsSubmitting(true);
                  
                  try {
                      const res = await fetch(imageString);
                      const blob = await res.blob();
                      const file = new File([blob], "proof.jpg", { type: "image/jpeg" });
                      
                      await submitProof(questId, note, file);
                      navigate('/my-quests');
                  } catch (e) { console.error(e); }
                  setIsSubmitting(false);
              }
          };
          resume();
      }
    }, [currentUser, id]);



  // 3. MEMORY CLEANUP (Prevents Lag)
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!quest) return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-brand-500 mr-2" /> Loading Quest...
    </div>
  );

  // --- ACTIONS ---

  // THE 4G FIX: Compress image BEFORE setting state
  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsCompressing(true); 

    try {
        const options = {
            maxSizeMB: 0.8,          
            maxWidthOrHeight: 1280,  
            useWebWorker: false // ✅ FIX: Must be false for Mobile stability
        };

        const compressedBlob = await imageCompression(file, options);
        
        // ✅ FIX: Convert Blob to File (Supabase strict mode)
        const compressedFile = new File([compressedBlob], file.name, { 
            type: file.type 
        });

        const url = URL.createObjectURL(compressedFile);
        
        setPreviewUrl(url);
        setSelectedFile(compressedFile);
    } catch (error) {
        console.error("Compression failed:", error);
        alert("Could not process image. Please try a different photo.");
    } finally {
        setIsCompressing(false);
    }
  };

  const handleOpenMaps = () => {
      const url = (quest.lat && quest.lng)
        ? `https://www.google.com/maps/dir/?api=1&destination=${quest.lat},${quest.lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(quest.location_address)}`;
      window.open(url, '_blank');
  };

  const handleAccept = async () => {
    if (!currentUser) return setShowAuthModal(true);
    if (isAccepting) return;

    setIsAccepting(true);
    try {
        await acceptQuest(quest.id);
        // Optimistic UI handled by Context
    } catch (error) {
        alert("Could not join quest. Please try again.");
    } finally {
        setIsAccepting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return alert("Please upload a photo!");
    
    setIsSubmitting(true); 

    try {
        // Convert the already compressed file to Base64
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        reader.onloadend = () => {
            const payload = {
                questId: quest.id,
                note: description,
                imageString: reader.result,
                type: 'proof_submission'
            };
            localStorage.setItem('sq_auto_proof', JSON.stringify(payload));
            window.location.reload();
        };
    } catch (error) {
        alert("Submission failed. Please try again.");
        setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
      <button onClick={() => navigate(-1)} className="text-brand-600 mb-4 font-medium flex items-center hover:underline">
        <ArrowLeft size={18} className="mr-1" /> Back to Explore
      </button>
      
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* HERO IMAGE (Protected) */}
        {/* onContextMenu prevents Right-Click Menu */}
        <div className="relative h-80" onContextMenu={(e) => e.preventDefault()}>
            <img 
              src={quest.image || 'https://via.placeholder.com/800x400'} 
              // select-none prevents highlighting, pointer-events-none stops dragging (on some browsers)
              className="w-full h-full object-cover select-none" 
              alt={quest.title}
              // draggable="false" stops the "drag to desktop" action
              draggable="false"
            />
            
            {/* INVISIBLE SHIELD: Sits on top of the image so clicks hit this div, not the image */}
            <div className="absolute inset-0 z-0"></div>
              
            <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg ${getCategoryColor(quest.category)}`}>
                {quest.category}
            </div>

            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-8">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{quest.title}</h1>
                <div className="flex flex-wrap items-center gap-3 text-white/90">
                    <span className="flex items-center"><MapPin size={18} className="mr-1" /> {quest.location_address}</span>
                    <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">⭐ {quest.xp_value} XP</span>
                </div>
            </div>
        </div>

        <div className="p-8">
          <button 
                onClick={handleOpenMaps}
                className="w-full mb-8 bg-blue-50 text-blue-600 border border-blue-200 py-3 rounded-xl font-bold hover:bg-blue-100 transition flex items-center justify-center"
             >
                <Navigation size={18} className="mr-2" /> Get Directions
          </button>

          {/* 1. Mission Brief (Yellow Box) */}
          <div className="bg-yellow-50 p-6 rounded-2xl mb-6 border border-yellow-200">
             <h3 className="font-bold text-yellow-800 text-lg mb-2">Mission Brief</h3>
             <p className="text-yellow-900 leading-relaxed">
         <LinkifyText text={quest.description} />
              </p>
          </div>

          {/* 2. Traveler Instructions (Blue Box) */}
          {quest.instructions && (
             <div className="bg-blue-50 p-6 rounded-2xl mb-6 border border-blue-100">
                <h3 className="font-bold text-blue-800 text-lg mb-2">How to Complete</h3>
                <p className="text-blue-900 leading-relaxed">
               <LinkifyText text={quest.instructions} />
              </p>
             </div>
          )}

          {/* 3. Proof Requirements (Gray Box) */}
          <div className="bg-gray-50 p-4 rounded-2xl mb-8 border border-gray-200">
             <h4 className="font-bold text-gray-700 text-xs uppercase tracking-widest mb-2">Submission Proof Required</h4>
             <p className="text-sm text-gray-600 flex items-center gap-2 italic font-medium whitespace-pre-line">
                <Camera size={18} className="text-brand-500" /> 
                {quest.proof_requirements || "Upload a photo of your activity to earn XP."}
             </p>
          </div>

          {/* ACTION AREA */}
          {!currentUser && (
             <button onClick={() => setShowAuthModal(true)} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition-all">
               Login to Join Quest
             </button>
          )}

          {currentUser && !isStarted && (
            <button 
                onClick={handleAccept} 
                disabled={isAccepting} 
                className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-700 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
                {isAccepting ? <Loader2 className="animate-spin"/> : 'Accept Quest '}
            </button>
          )}

          {status === 'approved' && (
            <div className="bg-green-100 text-green-800 p-6 rounded-xl text-center font-bold border border-green-200 flex flex-col items-center">
              <CheckCircle size={48} className="mb-2 text-green-600"/>
              <div>Quest Completed!</div>
              <div className="text-sm font-normal mt-1">You earned {quest.xp_value} XP.</div>
            </div>
          )}

          {status === 'pending' && (
            <div className="bg-blue-50 text-blue-800 p-6 rounded-xl text-center font-bold border border-blue-200 flex flex-col items-center">
              <Clock size={48} className="mb-2 text-blue-500"/>
              <div>Proof Submitted</div>
              <div className="text-sm font-normal mt-1">An admin is reviewing your submission.</div>
            </div>
          )}

          {(status === 'in_progress' || status === 'rejected') && (
            <form onSubmit={handleSubmit} className="border-t pt-6">
                
                {status === 'rejected' && (
                    <div className="mb-6 bg-red-50 p-4 rounded-lg flex items-center text-red-700 border border-red-200">
                        <AlertCircle className="mr-2" />
                        <span>Previous attempt rejected. Please try again with a clear photo.</span>
                    </div>
                )}

                <h3 className="text-xl font-bold mb-4">Submit Your Proof</h3>
                
                <div className="mb-4">
                    <div className={`relative w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${previewUrl ? 'border-brand-500 bg-white' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
                        <input 
                            type="file" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                            accept="image/*" 
                            onChange={handleImageSelect}
                        />
                        {isCompressing ? (
                            <div className="text-center">
                                <Loader2 className="animate-spin text-brand-500 w-8 h-8 mb-2 mx-auto"/>
                                <p className="text-sm font-bold text-brand-600">Optimizing for 4G...</p>
                            </div>
                        ) : previewUrl ? (
                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                            <div className="text-center">
                                <Camera className="w-10 h-10 mb-2 text-gray-400 mx-auto" />
                                <p className="text-sm font-bold text-gray-500">Tap to Upload Proof</p>
                            </div>
                        )}
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

                <button 
                    type="submit" 
                    disabled={isSubmitting || isCompressing || !selectedFile} 
                    className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-700 flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
                >
                    {isSubmitting ? <><Loader2 className="animate-spin"/> Uploading...</> : <><UploadCloud size={20}/> Submit Proof</>}
                </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestDetails;