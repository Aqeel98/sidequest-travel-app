import React, { useState, useEffect } from 'react';
import { PlusCircle, UploadCloud, Gift, Map, Edit, CheckCircle, Clock, LayoutDashboard, ArrowLeft } from 'lucide-react';
import { useSideQuest } from '../context/SideQuestContext';
import { supabase } from '../supabaseClient';
import imageCompression from 'browser-image-compression';

const PartnerDashboard = () => {
    // 1. Updated Destructuring
    const { currentUser, quests, rewards, questProgress, redemptions, users, addQuest, addReward, updateQuest, updateReward } = useSideQuest();
    
    // UI State
    const [view, setView] = useState('create'); 
    const [mode, setMode] = useState('quest');
    const [editingId, setEditingId] = useState(null);
    const [viewClaimsId, setViewClaimsId] = useState(null); // State for toggling claim list

    // Form State
    const [form, setForm] = useState({ category: 'Environmental', xp_value: 50, xp_cost: 50 });
    const [imageFile, setImageFile] = useState(null); 
    const [preview, setPreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Cleanup memory for image previews
    useEffect(() => {
        return () => { if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview); };
    }, [preview]);

    // FILTER: Only show what THIS Partner created
    const myQuests = quests.filter(q => q.created_by === currentUser?.id);
    const myRewards = rewards.filter(r => r.created_by === currentUser?.id);

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

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 1. VALIDATION: Check if image exists (either new file or existing preview)
        if (!imageFile && !preview) {
            alert(`Please select an image for your ${mode}.`);
            return;
        }

        setIsSubmitting(true);
    
        try {
            let finalImageUrl = preview; 
    
            // 2. UPLOAD LOGIC
            if (imageFile) {
                console.log("SQ-System: Processing image...");
                
                let fileToUpload = imageFile;

                // Attempt Compression (Safe Mode)
                try {
                    const options = { maxSizeMB: 1, maxWidthOrHeight: 1600, useWebWorker: false };
                    const compressedBlob = await imageCompression(imageFile, options);
                    fileToUpload = new File([compressedBlob], imageFile.name, { type: imageFile.type });
                } catch (cErr) {
                    console.warn("Compression skipped, uploading original.", cErr);
                }

                console.log("SQ-System: Uploading...");
                const fileName = `${mode}-images/${Date.now()}_${imageFile.name.replace(/\s/g, '')}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('proofs')
                    .upload(fileName, fileToUpload, { cacheControl: '3600', upsert: false });
                
                if (uploadError) throw uploadError;
                
                const { data } = supabase.storage.from('proofs').getPublicUrl(fileName);
                finalImageUrl = data.publicUrl;
                console.log("SQ-System: Upload Success!", finalImageUrl);
            }
    
            // 3. PREPARE DATA
            const payload = { 
                ...form, 
                image: finalImageUrl,
                ...(mode === 'quest' && {
                    xp_value: Number(form.xp_value),
                    lat: parseFloat(form.lat),
                    lng: parseFloat(form.lng)
                }),
                ...(mode === 'reward' && {
                    xp_cost: Number(form.xp_cost)
                })
            };
    
            // 4. SUBMIT TO DATABASE
            if (editingId) {
                if (mode === 'quest') await updateQuest(editingId, payload);
                else await updateReward(editingId, payload);
            } else {
                if (mode === 'quest') await addQuest(payload, null);
                else await addReward(payload, null);
            }
    
            // 5. CLEANUP
            console.log("SQ-System: Submission successful.");
            setEditingId(null);
            setForm({ category: 'Environmental', xp_value: 50, xp_cost: 50 });
            setImageFile(null);
            setPreview(null);
            setView('manage');
            
        } catch (err) {
            console.error("SQ-System: Error ->", err);
            alert("Error: " + (err.message || "Something went wrong"));
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
                        <div className="flex gap-4 mb-8">
                            <button onClick={() => setMode('quest')} className={`flex-1 py-4 rounded-2xl border-2 flex items-center justify-center font-bold text-lg transition-all ${mode === 'quest' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'}`}>
                                <Map className="mr-2" /> Impact Quest
                            </button>
                            <button onClick={() => setMode('reward')} className={`flex-1 py-4 rounded-2xl border-2 flex items-center justify-center font-bold text-lg transition-all ${mode === 'reward' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'}`}>
                                <Gift className="mr-2" /> Marketplace Reward
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
                            {mode === 'quest' ? (
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase mb-1 tracking-widest">Category</label>
                                    <select name="category" value={form.category || 'Environmental'} onChange={handleChange} className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-brand-500 outline-none">
                                        <option value="Environmental">Environmental</option>
                                        <option value="Social">Social</option>
                                        <option value="Animal Welfare">Animal Welfare</option>
                                        <option value="Education">Education</option>
                                        <option value="Cultural">Cultural</option>
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
                            <label className="block text-xs font-black text-gray-400 uppercase mb-1 tracking-widest">Description</label>
                            <textarea name="description" value={form.description || ''} onChange={handleChange} rows="3" className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-brand-500 outline-none" required />
                        </div>

                        <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-200">
                            <label className="block text-xs font-black text-gray-400 uppercase mb-3 tracking-widest">Item Photo</label>
                            <div className="flex items-center gap-6">
                                <label className="cursor-pointer bg-white border border-gray-300 px-6 py-3 rounded-xl hover:bg-gray-100 flex items-center shadow-sm transition-all">
                                    <UploadCloud className="text-brand-600 mr-2" size={20} />
                                    <span className="text-sm font-bold text-gray-600">Choose Image</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                </label>
                                {preview && <img src={preview} alt="Preview" className="h-20 w-20 object-cover rounded-xl border-2 border-white shadow-lg" />}
                            </div>
                        </div>
                        
                        {mode === 'quest' && (
                            <div className="space-y-6">
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
                                <div className="grid grid-cols-2 gap-4 bg-brand-50 p-6 rounded-2xl border border-brand-100">
                                    <div className="col-span-full mb-2"><h4 className="text-[10px] font-black text-brand-600 uppercase tracking-widest text-center">GPS Coordinates</h4></div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-brand-400 uppercase mb-1">Latitude</label>
                                        <input type="number" step="any" name="lat" value={form.lat || ''} onChange={handleChange} className="w-full border-0 p-3 rounded-xl shadow-sm outline-none" placeholder="6.696969" required />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-brand-400 uppercase mb-1">Longitude</label>
                                        
                                        <input type="number" step="any" name="lng" value={form.lng || ''} onChange={handleChange} className="w-full border-0 p-3 rounded-xl shadow-sm outline-none" placeholder="8.676767" required />
                                        <p className="col-span-full text-[10px] text-brand-400 italic text-center mt-2">
                                                Tip: Long-press your location in Google Maps to find these numbers.
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase mb-1 tracking-widest">Instructions for Travelers</label>
                                    <textarea name="instructions" value={form.instructions || ''} onChange={handleChange} rows="2" className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-brand-500 outline-none" required />
                                </div>
                            </div>
                        )}

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
                            // CALCULATE COMPLETIONS
                            const completedCount = questProgress.filter(p => p.quest_id === q.id && p.status === 'approved').length;
                            
                            return (
                                <div key={q.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <img src={q.image || "https://via.placeholder.com/60"} className="w-16 h-16 rounded-2xl object-cover border shadow-sm" />
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
                                            <img src={r.image || "https://via.placeholder.com/60"} className="w-16 h-16 rounded-2xl object-cover border shadow-sm" />
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