import React, { useState, useEffect } from 'react';
import { PlusCircle, UploadCloud, Gift, Map, Edit, CheckCircle, Clock, LayoutDashboard, ArrowLeft } from 'lucide-react';
import { useSideQuest } from '../context/SideQuestContext';
import { supabase } from '../supabaseClient';


const PartnerDashboard = () => {
    // 1. Updated Destructuring
    const { currentUser, quests, rewards, questProgress, redemptions, users, addQuest, addReward, updateQuest, updateReward, showToast,
        deleteQuest, deleteReward  } = useSideQuest();
    
    // UI State
    const [view, setView] = useState('create'); 
    const [mode, setMode] = useState('quest');
    const [editingId, setEditingId] = useState(null);
    const [viewClaimsId, setViewClaimsId] = useState(null); // State for toggling claim list
    const [showGps, setShowGps] = useState(false);

    // Form State
    const [form, setForm] = useState({ category: 'Environmental', xp_value: 50, xp_cost: 50 });
    const [imageFile, setImageFile] = useState(null); 
    const [preview, setPreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (editingId) return;
        const savedDraft = sessionStorage.getItem('sq_partner_draft');
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                setForm(prev => ({ ...prev, ...parsed }));
                if (parsed.lat && parsed.lat !== 0) setShowGps(true);
            } catch (e) { console.error("Draft restore error", e); }
        }
    }, [editingId]);

    useEffect(() => {
        if (!editingId && view === 'create') {
            sessionStorage.setItem('sq_partner_draft', JSON.stringify(form));
        }
    }, [form, editingId, view]);



    // Cleanup memory for image previews
    useEffect(() => {
        return () => { if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview); };
    }, [preview]);

    // FILTER: Only show what THIS Partner created
    const myQuests = currentUser?.role === 'Admin' 
    ? quests 
    : quests.filter(q => q.created_by === currentUser?.id);
    
    const myRewards = currentUser?.role === 'Admin' 
    ? rewards 
    : rewards.filter(r => r.created_by === currentUser?.id);

    if (currentUser?.role !== 'Partner' && currentUser?.role !== 'Admin') {
        return <div className="p-20 text-center font-bold text-red-500">Partner Access Required</div>;
    }

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreview(URL.createObjectURL(file)); 
        }
    };

    // --- TRIGGER EDIT MODE ---
    const startEdit = (item, itemMode) => {
        setMode(itemMode);
        setForm(item);
        setEditingId(item.id);
        setPreview(item.image);
        setView('create');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };


    // --- HELPER: 
    const optimizeImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX = 1200; // Resize to 1200px max
                    let w = img.width;
                    let h = img.height;
                    
                    if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } }
                    else { if (h > MAX) { w *= MAX / h; h = MAX; } }
                    
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    
                    // Compress to JPG 70%
                    canvas.toBlob((blob) => {
                        const safeName = `img_${Date.now()}.jpg`;
                        resolve(new File([blob], safeName, { type: 'image/jpeg' }));
                    }, 'image/jpeg', 0.7);
                };
            };
            reader.onerror = () => resolve(file); // Fallback
        });
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        
             // Check if empty
    if (!form.contact_phone) {
        showToast("Phone number is required.", 'error');
        return;
    }

    // Min 9 digits (local short), Max 15 (international standard is max 15)
    if (form.contact_phone.length < 9 || form.contact_phone.length > 15) {
        showToast("Invalid Phone Number length.", 'error');
        return;
    }



        // 1. VALIDATION
        if (!imageFile && !preview) {
            showToast("Please select an image.", 'error');
            return;
        }
    
        setIsSubmitting(true);
    
        try {
            let success = false;
    
            if (editingId) {
                // --- EDIT MODE ---
                let finalImageUrl = preview;
                
                if (imageFile) {
                    console.log("SQ-System: Optimizing image...");
                    
                    // ✅ FIX: Optimize locally using Canvas (Native, Fast, Light)
                    const optimizedFile = await optimizeImage(imageFile);
                    
                    // Upload the SMALL optimized file
                    const { error } = await supabase.storage
                        .from('quest-images')
                        .upload(optimizedFile.name, optimizedFile, { 
                            cacheControl: '3600',
                            upsert: true
                        });

                    if (error) throw error;
                    
                    const { data } = supabase.storage.from('quest-images').getPublicUrl(optimizedFile.name);
                    finalImageUrl = data.publicUrl;
                }
    
                // PREPARE DATA
                const payload = { 
                    title: form.title,
                    contact_phone: form.contact_phone,
                    description: form.description,
                    image: finalImageUrl 
                };
    
                if (mode === 'quest') {
                    payload.category = form.category;
                    payload.xp_value = parseInt(form.xp_value) || 0;
                    payload.location_address = form.location_address;
                    payload.lat = parseFloat(form.lat) || 0;
                    payload.lng = parseFloat(form.lng) || 0;
                    payload.instructions = form.instructions;
                    payload.proof_requirements = form.proof_requirements;
                    if (currentUser.role === 'Admin') payload.status = form.status;

                    success = await updateQuest(editingId, payload);
                } else {
                    payload.xp_cost = parseInt(form.xp_cost) || 0;
                    if (currentUser.role === 'Admin') payload.status = form.status;
                    success = await updateReward(editingId, payload);
                }
    
            } else {
                // --- CREATE MODE ---
                // (Context already handles optimization for AddQuest, so we just pass the file)
                if (mode === 'quest') success = await addQuest(form, imageFile);
                else success = await addReward(form, imageFile);
            }
    
            // RESET UI ON SUCCESS
            if (success) {
                sessionStorage.removeItem('sq_partner_draft');
                setEditingId(null);
                setForm({ category: 'Environmental', xp_value: 50, xp_cost: 50, lat: 0, lng: 0 });
                setImageFile(null);
                setPreview(null);
                setView('manage'); 
            }
            
        } catch (err) {
            console.error("Dashboard Error:", err);
            showToast("Error: " + (err.message || "Connection failed"), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                <h1 className="text-3xl font-black text-gray-900 flex items-center tracking-tight">
                    <LayoutDashboard className="text-brand-600 mr-3" size={32} />
                    Partner Portal
                </h1>
                
                <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200 shadow-inner">
                    <button 
                        onClick={() => {setView('create'); setEditingId(null); setForm({category:'Environmental', xp_value: 50, xp_cost: 50}); setPreview(null);}} 
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'create' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500'}`}
                    >
                        {editingId ? 'Edit Mode' : 'Add New'}
                    </button>

                    <button 
                        onClick={() => setView('manage')} 
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'manage' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500'}`}
                    >
                        My Content
                    </button>
                </div>
            </div>

            {view === 'create' ? (
                /* --- FORM VIEW (CREATE & EDIT) --- */
                <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <button onClick={() => setView('manage')} className="flex items-center text-sm font-bold text-gray-400 hover:text-brand-600 mb-6 transition-colors">
                        <ArrowLeft size={16} className="mr-1"/> Back to My Content
                    </button>

                    {!editingId && (
    <div className="flex flex-col sm:flex-row gap-4 mb-8">
        {/* IMPACT QUEST BUTTON */}
        <button 
            onClick={() => setMode('quest')} 
            className={`flex-1 p-4 rounded-2xl border-2 flex flex-col items-center justify-center font-bold transition-all ${mode === 'quest' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'}`}
        >
            <Map className="mb-2" size={24} />
            <span className="text-sm md:text-lg text-center leading-tight">Impact Quest</span>
        </button>

        {/* MARKETPLACE REWARD BUTTON */}
        <button 
            onClick={() => setMode('reward')} 
            className={`flex-1 p-4 rounded-2xl border-2 flex flex-col items-center justify-center font-bold transition-all ${mode === 'reward' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'}`}
        >
            <Gift className="mb-2" size={24} /> 
            <span className="text-sm md:text-lg text-center leading-tight">Marketplace Reward</span>
        </button>
    </div>
)}

                    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 space-y-6">
                        <h2 className="text-2xl font-black text-gray-800">{editingId ? 'Edit Information' : `New ${mode === 'quest' ? 'Quest' : 'Reward'}`}</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-full md:col-span-1">
                                <label className="block text-xs font-black text-gray-400 uppercase mb-1 tracking-widest">Title</label>
                                <input type="text" name="title" value={form.title || ''} onChange={handleChange} className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-brand-500 outline-none" required />
                            </div>
                            {/* PHONE NUMBER FIELD */}
                                <div>
                                 <label className="block text-xs font-black text-gray-400 uppercase mb-1 tracking-widest">
                                  WhatsApp Contact
                                 </label>
                                 <input 
                                             type="tel" 
                                             inputMode="numeric"
                                             pattern="[+]?[0-9]*" 
                                                 name="contact_phone" 
                                                value={form.contact_phone || ''} 
                                                onChange={(e) => {
                                                    const cleanVal = e.target.value.replace(/[^0-9+]/g, '');
                                                       setForm({ ...form, contact_phone: cleanVal });
                                                       }} 
                                            placeholder="+94771234567"
                                          className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-brand-500 outline-none" 
                                         required 
                                />
                                 <p className="text-[10px] text-gray-400 mt-1 italic">
                                        Required for verification. We will only contact you for urgent location issues.
                                   </p>
                                    </div>
                            {mode === 'quest' ? (
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase mb-1 tracking-widest">Category</label>
                                    <select name="category" value={form.category || 'Environmental'} onChange={handleChange} className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-brand-500 outline-none">
                                        <option value="Environmental">Environmental</option>
                                        <option value="Social">Social</option>
                                        <option value="Animal Welfare">Animal Welfare</option>
                                        <option value="Education">Education</option>
                                        <option value="Cultural">Cultural</option>
                                        <option value="Adventure">Adventure</option>
                                        <option value="Exploration">Exploration</option>
                                        <option value="Marine Adventure">Marine Adventure</option>
                                        <option value="Wildlife Adventure">Wildlife Adventure</option>
                                    </select>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase mb-1 tracking-widest">XP Cost</label>
                                    <input type="number" name="xp_cost" value={form.xp_cost} onChange={handleChange} className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-brand-500 outline-none" required />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase mb-1 tracking-widest">Mission Brief</label>
                            <textarea name="description" value={form.description || ''} onChange={handleChange} rows="3" className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-brand-500 outline-none" required />
                        </div>

                        
                        
                        {mode === 'quest' && (
    <div className="space-y-6">
        {/* 1. BASIC DETAILS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-1 tracking-widest">XP Reward Value</label>
                <input type="number" name="xp_value" value={form.xp_value} onChange={handleChange} className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-brand-500 outline-none" />
            </div>
            <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-1 tracking-widest">Location Name</label>
                <input type="text" name="location_address" value={form.location_address || ''} onChange={handleChange} className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-brand-500 outline-none" required />
            </div>
        </div>

        {/* 2. HYBRID LOCATION BLOCK (The New Way) */}
        <div className="bg-brand-50 p-6 rounded-2xl border border-brand-100">
            <label className="block text-[10px] font-black text-brand-600 uppercase mb-3 tracking-widest flex items-center">
                <Map size={14} className="mr-1"/> Location Source (Google Maps)
            </label>
            
            <input 
                type="url" 
                name="map_link" 
                value={form.map_link || ''} 
                onChange={handleChange}
                placeholder="Paste Google Maps Link here..."
                className="w-full border-0 p-3 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-brand-200 text-sm"
                required
            />

            {!showGps ? (
                <button 
                    type="button" 
                    onClick={() => setShowGps(true)}
                    className="mt-3 text-[10px] font-bold text-brand-400 hover:text-brand-600 transition-colors underline"
                >
                    Know exact Coordinates? Click to add manually.
                </button>
            ) : (
                <div className="grid grid-cols-2 gap-4 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div>
                        <label className="block text-[10px] font-bold text-brand-400 uppercase mb-1">Latitude</label>
                        <input type="number" step="any" name="lat" value={form.lat || ''} onChange={handleChange} className="w-full border-0 p-3 rounded-xl shadow-sm outline-none text-xs" placeholder="6.6969" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-brand-400 uppercase mb-1">Longitude</label>
                        <input type="number" step="any" name="lng" value={form.lng || ''} onChange={handleChange} className="w-full border-0 p-3 rounded-xl shadow-sm outline-none text-xs" placeholder="80.6767" />
                    </div>
                </div>
            )}
        </div>
        
        {/* 3. INSTRUCTIONS & PROOF */}
        <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-1 tracking-widest">Instructions for Travelers</label>
            <textarea name="instructions" value={form.instructions || ''} onChange={handleChange} rows="2" className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-brand-500 outline-none" placeholder="How to find the location..." required />
        </div>

        <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-1 tracking-widest">Submission Proof Required</label>
            <input 
                type="text" 
                name="proof_requirements" 
                value={form.proof_requirements || ''} 
                onChange={handleChange} 
                className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-brand-500 outline-none" 
                placeholder="e.g. Upload a photo of the statue..." 
            />
                 </div>

                  </div>
                )}
                {/* 4. ITEM PHOTO (MOVED TO BOTTOM FOR PWA RELIABILITY) */}
        <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-200">
            <label className="block text-xs font-black text-gray-400 uppercase mb-3 tracking-widest">
                Quest Photo 
            </label>
            <div className="flex items-center gap-6">
                <label className="cursor-pointer bg-white border border-gray-300 px-6 py-3 rounded-xl hover:bg-gray-100 flex items-center shadow-sm transition-all">
                    <UploadCloud className="text-brand-600 mr-2" size={20} />
                    <span className="text-sm font-bold text-gray-600">Choose Image</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
                {preview && <img src={preview} alt="Preview" className="h-20 w-20 object-cover rounded-xl border-2 border-white shadow-lg" />}
            </div>
            
            {/* Draft Logic UI Feedback */}
            {!imageFile && !preview && form.title && (
                <p className="mt-3 text-[10px] text-brand-600 font-bold bg-brand-50 p-2 rounded animate-pulse">
                    ✨ Draft Restored! Please re-select your photo before publishing.
                </p>
            )}
                   </div>

                        <button type="submit" disabled={isSubmitting} className={`w-full text-white py-4 rounded-2xl font-black text-lg shadow-xl transition-all transform active:scale-95 flex items-center justify-center ${mode === 'quest' ? 'bg-brand-600 hover:bg-brand-700 shadow-brand-200' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-200'}`}>
                            {isSubmitting ? 'Processing...' : (editingId ? 'Save & Resubmit for Approval' : 'Publish to SideQuest')}
                        </button>
                    </form>
                </div>
            ) : (
                /* --- MANAGE VIEW --- */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in duration-500">
                    
                    {/* MY QUESTS SECTION */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-black text-gray-900 flex items-center border-b pb-4">
                            <Map size={24} className="mr-3 text-brand-600"/> My Active Quests
                        </h2>
                        
                        {myQuests.length === 0 ? <p className="text-gray-400 py-10 text-center bg-white rounded-3xl border border-dashed">No quests yet.</p> :
                        myQuests.map(q => {
                            // CALCULATE 
                            const completedCount = questProgress.filter(p => p.quest_id === q.id && p.status === 'approved').length;
                            
                            return (
                                <div key={q.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl border shadow-sm overflow-hidden bg-gray-100 flex-shrink-0">
                                                             {q.image ? (
                                             <img src={q.image} className="w-full h-full object-cover" alt={q.title} />
                                               ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                  <Map size={24} />
                                            </div>
                                 )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 leading-tight">{q.title}</p>
                                                <div className="mt-1 flex items-center gap-2">
                                                    {q.status === 'active' ? 
                                                        <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-black border border-emerald-100">LIVE</span> :
                                                        <span className="text-[10px] bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-full font-black border border-yellow-100">IN REVIEW</span>
                                                    }
                                                    {/* SHOW COMPLETION STATS */}
                                                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-black border border-blue-100 flex items-center">
                                                        <CheckCircle size={10} className="mr-1"/> {completedCount} Completed
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => startEdit(q, 'quest')} className="p-2 text-gray-300 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all"><Edit size={20} /></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* MY REWARDS SECTION */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-black text-gray-900 flex items-center border-b pb-4">
                            <Gift size={24} className="mr-3 text-orange-600"/> My Rewards
                        </h2>
                        
                        {myRewards.length === 0 ? <p className="text-gray-400 py-10 text-center bg-white rounded-3xl border border-dashed">No rewards yet.</p> :
                        myRewards.map(r => {
                            // CALCULATE CLAIMS
                            const claims = redemptions.filter(red => red.reward_id === r.id);
                            const isExpanded = viewClaimsId === r.id;

                            return (
                                <div key={r.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
                                    <div className="p-5 flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl border shadow-sm overflow-hidden bg-gray-100 flex-shrink-0">
                                            {r.image ? (
                                          <img src={r.image} className="w-full h-full object-cover" alt={r.title} />
                                            ) : (
                               <div className="w-full h-full flex items-center justify-center text-gray-400">
                                          <Gift size={24} />
                           </div>
                                                      )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 leading-tight">{r.title}</p>
                                                <div className="mt-1 flex items-center gap-3">
                                                    {r.status === 'active' ? 
                                                        <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-black border border-emerald-100">ACTIVE</span> :
                                                        <span className="text-[10px] bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-full font-black border border-yellow-100">REVIEWING</span>
                                                    }
                                                    {/* SHOW CLAIM STATS */}
                                                    <button 
                                                        onClick={() => setViewClaimsId(isExpanded ? null : r.id)}
                                                        className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-black border border-orange-100 hover:bg-orange-100 transition-colors cursor-pointer"
                                                    >
                                                        🎁 {claims.length} Claimed {isExpanded ? '▲' : '▼'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => startEdit(r, 'reward')} className="p-2 text-gray-300 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all"><Edit size={20} /></button>
                                    </div>

                                    {/* EXPANDED CLAIM LIST */}
                                    {isExpanded && (
                                        <div className="bg-orange-50/50 p-4 border-t border-orange-100 animate-in slide-in-from-top-2 duration-200">
                                            <h4 className="text-xs font-bold text-orange-800 uppercase mb-2 ml-1">Recent Claims</h4>
                                            {claims.length === 0 ? (
                                                <p className="text-xs text-gray-500 italic ml-1">No claims yet.</p>
                                            ) : (
                                                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                                    {claims.map(claim => {
                                                        const traveler = users.find(u => u.id === claim.traveler_id);
                                                        return (
                                                            <div key={claim.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-orange-100 shadow-sm">
                                                                <span className="text-xs font-bold text-gray-700">
                                                                    {traveler?.full_name || traveler?.email || 'Unknown Traveler'}
                                                                </span>
                                                                <span className="text-[10px] font-mono font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-200">
                                                                    {claim.redemption_code}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PartnerDashboard;