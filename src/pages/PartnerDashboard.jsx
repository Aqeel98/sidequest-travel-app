import React, { useState, useEffect } from 'react';
import { PlusCircle, UploadCloud, Gift, Map, Edit, CheckCircle, Clock, LayoutDashboard, ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useSideQuest } from '../context/SideQuestContext';
import { supabase } from '../supabaseClient';


const PartnerDashboard = () => {
    // 1. Updated Destructuring
    const { currentUser, quests, rewards, questProgress, redemptions, users, addQuest, addReward, updateQuest, updateReward, showToast,
        deleteQuest, deleteReward, verifyRedemptionCode } = useSideQuest();
    
    // UI State
    const [view, setView] = useState('create'); 
    const [mode, setMode] = useState('quest');
    const [editingId, setEditingId] = useState(null);
    const [viewClaimsId, setViewClaimsId] = useState(null); 
    const [showGps, setShowGps] = useState(false);

    // Form State
    const [form, setForm] = useState({ category: 'Environmental', xp_value: 50, xp_cost: 50 });
    const [imageFile, setImageFile] = useState(null); 
    const [preview, setPreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab');
    
    useEffect(() => {
        if (activeTab === 'create') {
            setView('create');
            setEditingId(null);
        } else if (activeTab === 'manage' || activeTab === 'verify') {
            setView('manage');
        }
    }, [activeTab]);


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

    // --- 1. THE IMMORTAL PARTNER RESUME ENGINE ---
    useEffect(() => {
        const pendingVoucher = localStorage.getItem('sq_pending_voucher');
        if (pendingVoucher && currentUser) {
            localStorage.removeItem('sq_pending_voucher');
            
            const timer = setTimeout(() => {
                verifyRedemptionCode(pendingVoucher); 
            }, 800); // 0.8 second delay for reliability
            
            return () => clearTimeout(timer);
        }

        const pendingData = localStorage.getItem('sq_auto_submit');
        
        // Ensure data exists and user is hydrated from Context
        if (pendingData && currentUser) {
            const resumeSubmit = async () => {
                const { form: sForm, imageString, mode: sMode, editingId: sId } = JSON.parse(pendingData);
                
                // Clear immediately to prevent accidental loops
                localStorage.removeItem('sq_auto_submit'); 
                setIsSubmitting(true);
                
                try {
                    // STEP A: RECONSTRUCT FILE FROM MEMORY
                    let finalFile = null;
                    if (imageString && imageString.startsWith('data:')) {
                        const res = await fetch(imageString);
                        const blob = await res.blob();
                        finalFile = new File([blob], "upload.jpg", { type: "image/jpeg" });
                    }

                    let success = false;

                    if (sId) {
                        // --- SCENARIO A: RESUMING AN EDIT (ACCURATE MAPPING) ---
                        
                        let currentImageUrl = sForm.image; 
                        
                        // If the Partner updated the photo, we upload it now before updating the Quest row
                        if (finalFile) {
                            const cleanFileName = `quest_${Date.now()}_resubmit.jpg`;
                            const { error: upErr } = await supabase.storage
                                .from('quest-images')
                                .upload(cleanFileName, finalFile);
                            
                            if (!upErr) {
                                const { data: urlData } = supabase.storage.from('quest-images').getPublicUrl(cleanFileName);
                                currentImageUrl = urlData.publicUrl;
                            }
                        }

                        // THE EXPLICIT FIELD MAPPING (Ensures DB Integrity)
                        const payload = { 
                            title: sForm.title,
                            contact_phone: sForm.contact_phone,
                            description: sForm.description,
                            image: currentImageUrl,
                            status: 'pending_admin' // Force re-approval on edit
                        };

                        if (sMode === 'quest') {
                            payload.category = sForm.category;
                            payload.xp_value = parseInt(sForm.xp_value) || 0;
                            payload.location_address = sForm.location_address;
                            payload.lat = parseFloat(sForm.lat) || 0;
                            payload.lng = parseFloat(sForm.lng) || 0;
                            payload.instructions = sForm.instructions;
                            payload.proof_requirements = sForm.proof_requirements;
                            payload.map_link = sForm.map_link;
                            
                            success = await updateQuest(sId, payload);
                        } else {
                            payload.xp_cost = parseInt(sForm.xp_cost) || 0;
                            success = await updateReward(sId, payload);
                        }

                    } else {
                        // --- SCENARIO B: RESUMING A NEW CREATION ---
                        if (sMode === 'quest') {
                            success = await addQuest(sForm, finalFile);
                        } else {
                            success = await addReward(sForm, finalFile);
                        }
                    }
                    
                    if (success) {
                        // Clean up the draft memory
                        sessionStorage.removeItem('sq_partner_draft');
                        showToast(sId ? "Changes Resubmitted for Approval!" : "Published! Awaiting Review.", 'success');
                        setView('manage');
                    }
                } catch (e) { 
                    console.error("SQ-Partner-Resume-Error:", e);
                    showToast("Network reset failed. Try saving again.", 'error'); 
                } finally {
                    setIsSubmitting(false);
                }
            };
            resumeSubmit();
        }
    }, [currentUser?.id]); 



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
        
        // 1. PHONE VALIDATION
        if (!form.contact_phone) {
            showToast("Phone number is required.", 'error');
            return;
        }

        if (form.contact_phone.length < 9 || form.contact_phone.length > 15) {
            showToast("Invalid Phone Number length.", 'error');
            return;
        }

        // 2. IMAGE VALIDATION
        if (!imageFile && !preview) {
            showToast("Please select an image.", 'error');
            return;
        }
    
        setIsSubmitting(true);
        showToast("Waking up 4G connection...", "info");

        try {
            // 3. IMAGE PREPARATION
            // If it's an Edit without a new file, we use the existing 'preview' URL.
            // If it's a new file, we optimize and convert to String.
            let imageToStore = preview; 

            if (imageFile) {
                console.log("SQ-System: Optimizing image for memory transfer...");
                const optimizedFile = await optimizeImage(imageFile);
                
                imageToStore = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(optimizedFile);
                });
            }
            
            // 4. PERSISTENCE PAYLOAD
            // We save EVERYTHING required to recreate the original logic after the refresh.
            const payload = { 
                form, 
                imageString: imageToStore, 
                mode, 
                editingId // null for Create, ID for Edit
            };
            
            localStorage.setItem('sq_auto_submit', JSON.stringify(payload));
            
            // 5. THE HARD REFRESH
            // This forces the phone to kill "Zombie" sockets and start a fresh connection.
            window.location.reload();

        } catch (err) {
            console.error("SQ-Submit-Error:", err);
            showToast("Device hardware busy. Please try again.", 'error');
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
                                
                        {mode === 'reward' && (
                            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                                <label className="block text-xs font-black text-orange-700 uppercase mb-2 tracking-widest flex items-center">
                                    <Map size={14} className="mr-1"/> Business Location (Google Maps)
                                </label>
                                
                                <div className="flex gap-2">
                                    <input 
                                        type="url" 
                                        name="map_link" 
                                        value={form.map_link || ''} 
                                        onChange={handleChange} 
                                        placeholder="Paste Google Maps link here..."
                                        className="flex-1 border-0 p-3 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-orange-200 text-sm"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => window.open('https://www.google.com/maps', '_blank')}
                                        className="bg-white border border-orange-200 text-orange-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-orange-100 transition-colors shadow-sm"
                                    >
                                        Open Maps 📍
                                    </button>
                                </div>
                                <p className="text-[10px] text-orange-400 mt-2 italic">
                                    Click "Open Maps", find your shop, copy the URL from the browser, and paste it here.
                                </p>
                            </div>
                        )}


<div>
    <label className="block text-xs font-black text-gray-400 uppercase mb-1 tracking-widest flex justify-between">
        Mission Brief
        <span className="text-[9px] text-brand-500 lowercase font-normal italic">
            Tip: Use [Display Text](Link URL) to hide links
        </span>
    </label>
    <textarea 
        name="description" 
        value={form.description || ''} 
        onChange={handleChange} 
        rows="3" 
        className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-brand-500 outline-none" 
        placeholder="Example: Visit [our website](https://example.com) to see our impact history."
        required 
    />
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

        {/* 2. HYBRID LOCATION BLOCK  */}
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
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                            <label className="block text-[10px] font-bold text-brand-400 uppercase mb-1">Latitude</label>
                            <input type="number" step="any" name="lat" value={form.lat || ''} onChange={handleChange} className="w-full border-0 p-3 rounded-xl shadow-sm outline-none text-xs" placeholder="6.6969" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-brand-400 uppercase mb-1">Longitude</label>
                            <input type="number" step="any" name="lng" value={form.lng || ''} onChange={handleChange} className="w-full border-0 p-3 rounded-xl shadow-sm outline-none text-xs" placeholder="80.6767" />
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="bg-white/60 p-3 rounded-lg border border-brand-200 text-center">
                            <p className="text-[10px] text-gray-600 leading-relaxed">
                                <span className="font-bold text-brand-600">How to find this?</span> <br/>
                                Open <a href="https://www.google.com/maps" target="_blank" rel="noreferrer" className="text-blue-500 underline hover:text-blue-700 font-bold">Google Maps</a>. 
                                <span className="font-bold"> Right-Click</span> (or Long-Press on mobile) on the exact spot. 
                                Click the numbers at the top to copy them. <br/>
                                <span className="italic text-gray-400">(Example: 6.9344, 79.8428)</span>
                            </p>
                        </div>
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
            {mode === 'quest' ? 'Quest Photo' : 'Reward Photo'}</label>

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

                    {/* NEW: QUICK VERIFY BOX (Add this here) */}
             <div className="col-span-full bg-white p-6 rounded-3xl border-2 border-brand-100 shadow-sm mb-2">
        <h3 className="text-lg font-black text-gray-900 mb-2 flex items-center">
            <CheckCircle className="text-brand-600 mr-2" size={20}/> Verify Traveler Code
        </h3>
        <p className="text-xs text-gray-500 mb-4">Enter the SQ-Code from the traveler's phone to mark it as used.</p>
        <form className="flex gap-2" onSubmit={(e) => {
    e.preventDefault();
    const code = e.target.vCode.value;
    if (!code) return;
    
    // 1. Save code to hardware memory
    localStorage.setItem('sq_pending_voucher', code);
    
    // 2. Force hard refresh to kill Zombie Sockets
    window.location.reload();
}}>
    <input 
        name="vCode" 
        type="text" 
        placeholder="e.g. SQ-KJ92-45" 
        className="flex-1 bg-gray-50 border-2 border-gray-100 p-3 rounded-xl focus:border-brand-500 outline-none font-mono font-bold uppercase" 
        required 
    />
    <button type="submit" className="bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-700 transition-all">
        Verify
    </button>
</form>
                    </div>
                    
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
                            {claims.map(claim => (
                                 <div key={claim.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-orange-100 shadow-sm">
                                    <div className="flex flex-col">
                                   <span className="text-xs font-bold text-gray-700">
                                {/* This uses the name joined from the profiles table in Context */}
                                {claim.profiles?.full_name || 'Adventurer'}
                                 </span>
 
                                 <span className={`text-[9px] font-bold uppercase ${claim.status === 'verified' ? 'text-green-500' : 'text-orange-400'}`}>
                                  {claim.status === 'verified' ? '✓ Used' : '○ Not Used Yet'}
                                   </span>
                                  </div>    
                                   {/* Updated Code Badge styling */}
                                   <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded border ${
                                        claim.status === 'verified' 
                                      ? 'text-gray-400 bg-gray-50 border-gray-100' 
                                       : 'text-orange-600 bg-orange-50 border-orange-200'
                                        }`}>
                                       {claim.redemption_code}
                                               </span>
                                          </div>
                                         ))}
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