import React, { useState, useEffect, useMemo } from 'react';
import { useSideQuest } from '../context/SideQuestContext';
import imageCompression from 'browser-image-compression';
import { supabase } from '../supabaseClient'; 
import { 
  PlusCircle, Edit, Trash2, Check, MapPin, Award, 
  UploadCloud, Info, Gift, CheckCircle, BarChart2, Users as UsersIcon 
} from 'lucide-react';

// --- SUB-COMPONENT: STAT CARD (New for Oversight) ---
const StatCard = ({ title, value, subtext, icon: Icon, colorClass }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between transition-all hover:shadow-md">
        <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{title}</p>
            <h3 className="text-3xl font-black text-gray-900 mt-1">{value}</h3>
            {subtext && <p className="text-xs text-gray-400 mt-1 font-medium">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-xl ${colorClass}`}>
            <Icon size={24} />
        </div>
    </div>
);

// --- EDIT FORM COMPONENT (Fixed: Uploads to 'quest-images' Public Bucket) ---
const EditForm = ({ item, onSave, onCancel, type }) => {
    const [formData, setFormData] = useState(item);
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(item.image || null);

    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    useEffect(() => {
        setPreviewUrl(item.image || null);
        setFormData(item);
    }, [item.id, item.image]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
    
        setUploading(true);
        try {
            let fileToUpload = file; 

            // 1. Attempt Safe Compression (Technical Bible Standard)
            try {
                const options = { maxSizeMB: 1, maxWidthOrHeight: 1600, useWebWorker: false };
                const compressedBlob = await imageCompression(file, options);
                
                // Convert Blob to File to prevent Supabase upload errors
                fileToUpload = new File([compressedBlob], file.name, { 
                    type: file.type 
                });
            } catch (compressionError) {
                console.warn("Admin: Compression skipped, using original.", compressionError);
            }
            
            // 2. Local Preview
            const localPreview = URL.createObjectURL(fileToUpload);
            setPreviewUrl(localPreview); 
    
            // 3. Upload Logic (Corrected)
            console.log("SQ-Admin: Uploading to quest-images...");
            
            // ✅ FIX 1: Remove folder prefix to match Partner structure
            const fileName = `${Date.now()}_${file.name.replace(/\s/g, '')}`;
            
            // ✅ FIX 2: Upload to 'quest-images' (Public) instead of 'proofs' (Private)
            const { error: uploadError } = await supabase.storage
              .from('quest-images')
              .upload(fileName, fileToUpload, { cacheControl: '3600', upsert: false });
            
            if (uploadError) throw uploadError;
    
            // ✅ FIX 3: Get the public URL from the correct bucket
            const { data } = supabase.storage.from('quest-images').getPublicUrl(fileName);
            setFormData(prev => ({ ...prev, image: data.publicUrl }));
            
            alert("Image uploaded! Click 'Save Changes' to confirm.");
        } catch (error) {
            console.error("Admin Upload Error:", error);
            setPreviewUrl(item.image || null); // Revert preview on failure
            alert("Upload failed: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const fields = type === 'quest' ? [
        { name: 'title', label: 'Title', type: 'text' },
        { name: 'category', label: 'Category', type: 'select', options: ['Environmental', 'Social', 'Animal Welfare', 'Education', 'Cultural'] },
        { name: 'xp_value', label: 'XP Value', type: 'number' },
        { name: 'location_address', label: 'Location Name', type: 'text' },
        { name: 'lat', label: 'Latitude (Decimal Only)', type: 'number' },
        { name: 'lng', label: 'Longitude (Decimal Only)', type: 'number' },
        { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'pending_admin'] },
        { name: 'description', label: 'Impact Description', type: 'textarea' },
        { name: 'instructions', label: 'Traveler Instructions', type: 'textarea' },
        { name: 'proof_requirements', label: 'Proof Requirements', type: 'textarea' },
    ] : [ 
        { name: 'title', label: 'Reward Title', type: 'text' },
        { name: 'xp_cost', label: 'XP Cost', type: 'number' },
        { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'pending_admin'] },
        { name: 'description', label: 'Reward Description', type: 'textarea' },
    ];

    return (
        <form className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200 space-y-3" onSubmit={(e) => { e.preventDefault(); onSave(item.id, formData); }}>
            <h4 className="font-bold text-lg">{type === 'quest' ? 'Edit Quest' : 'Edit Reward'}</h4>
            {fields.map(field => (
                <div key={field.name}>
                    <label className="block text-xs font-medium text-gray-700">{field.label}</label>
                    {field.type === 'textarea' ? (
                        <textarea name={field.name} value={formData[field.name] || ''} onChange={handleChange} className="mt-1 w-full border p-2 rounded text-sm" rows="3" />
                    ) : field.type === 'select' ? (
                        <select name={field.name} value={formData[field.name] || ''} onChange={handleChange} className="mt-1 w-full border p-2 rounded text-sm">
                            {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    ) : (
                        <input 
    type={field.type} 
    name={field.name} 
    step={field.name === 'lat' || field.name === 'lng' ? "any" : "1"}
    value={formData[field.name] || ''} 
    onChange={handleChange} 
    className="mt-1 w-full border p-2 rounded text-sm" 
/>
                    )}
                </div>
            ))}
            <div className="border-t pt-2 mt-2">
                <label className="block text-xs font-medium text-gray-700 mb-2">Quest/Reward Image</label>
                <div className="flex items-center gap-4">
                    {previewUrl && <img src={previewUrl} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-gray-300" />}
                    <label className={`cursor-pointer bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center transition-all shadow-sm ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <UploadCloud size={18} className="mr-2 text-brand-600" />
                        {uploading ? "Uploading..." : "Change Photo"}
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                </div>
                <input type="hidden" name="image" value={formData.image || ''} />
            </div>
            <div className="flex gap-3 justify-end pt-4">
                <button type="button" onClick={onCancel} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm transition">Cancel</button>
                <button type="submit" disabled={uploading} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition font-bold shadow">Save Changes</button>
            </div>
        </form>
    );
};

// --- MAIN ADMIN DASHBOARD ---
const Admin = () => {
  const { 
    currentUser, questProgress, quests, rewards, users, redemptions,
    approveSubmission, rejectSubmission, approveNewQuest, approveNewReward, 
    updateQuest, deleteQuest, updateReward, deleteReward 
  } = useSideQuest();

  const [activeTab, setActiveTab] = useState('dashboard'); // Default changed to dashboard
  const [editingId, setEditingId] = useState(null);
  const [viewDetailsId, setViewDetailsId] = useState(null);

  if (currentUser?.role !== 'Admin') {
    return (
      <div className="p-12 text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Admin Access Only</h2>
        <p className="text-gray-600">Please log in with an Admin account.</p>
      </div>
    );
  }

  // --- ECOSYSTEM LOGIC (The Accuracy Update) ---
  const stats = useMemo(() => {
    const approved = questProgress.filter(p => p.status === 'approved');
    const pending = questProgress.filter(p => p.status === 'pending');
    const totalXP = users.reduce((sum, u) => sum + (u.xp || 0), 0);
    
    const categories = approved.reduce((acc, p) => {
        const q = quests.find(quest => quest.id === p.quest_id);
        const cat = q?.category || 'Other';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {});

    return { approvedCount: approved.length, pendingCount: pending.length, totalXP, redemptionCount: redemptions.length, userCount: users.length, categories };
  }, [questProgress, quests, users, redemptions]);

  const pendingSubmissions = questProgress.filter(p => p.status === 'pending');
  const pendingNewQuests = quests.filter(q => q.status === 'pending_admin');
  const pendingNewRewards = rewards.filter(r => r.status === 'pending_admin');

  const manageableQuests = quests.filter(q => q.status !== 'pending_admin');
  const activeRewards = rewards.filter(r => r.status === 'active');  

  // Handlers
  const handleSaveQuest = (id, fields) => { updateQuest(id, fields); setEditingId(null); };
  const handleSaveReward = (id, fields) => { updateReward(id, fields); setEditingId(null); };
  const handleDeleteQuest = (id) => { if(window.confirm('Are you sure you want to delete this quest?')) deleteQuest(id); };
  const handleDeleteReward = (id) => { if(window.confirm('Are you sure you want to delete this reward?')) deleteReward(id); };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-black mb-8 text-gray-900 tracking-tight">Game Master Oversight</h1>

      {/* --- TAB NAVIGATION --- */}
      <div className="flex border-b mb-8 overflow-x-auto gap-2 pb-2 scrollbar-hide">
        <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 font-bold transition whitespace-nowrap ${activeTab === 'dashboard' ? 'border-b-4 border-brand-500 text-brand-600' : 'text-gray-500 hover:text-brand-600'}`}>
          Ecosystem Stats
        </button>
        <button onClick={() => setActiveTab('submissions')} className={`px-4 py-2 font-bold transition whitespace-nowrap ${activeTab === 'submissions' ? 'border-b-4 border-yellow-500 text-yellow-600' : 'text-gray-500 hover:text-yellow-600'}`}>
          Proofs ({pendingSubmissions.length})
        </button>
        <button onClick={() => setActiveTab('newQuests')} className={`px-4 py-2 font-bold transition whitespace-nowrap ${activeTab === 'newQuests' ? 'border-b-4 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}>
          New Quests ({pendingNewQuests.length})
        </button>
        <button onClick={() => setActiveTab('newRewards')} className={`px-4 py-2 font-bold transition whitespace-nowrap ${activeTab === 'newRewards' ? 'border-b-4 border-orange-500 text-orange-600' : 'text-gray-500 hover:text-orange-600'}`}>
          New Rewards ({pendingNewRewards.length})
        </button>
        <button onClick={() => setActiveTab('quests')} className={`px-4 py-2 font-bold transition whitespace-nowrap ${activeTab === 'quests' ? 'border-b-4 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-indigo-600'}`}>
          Quest Manager
        </button>
        <button onClick={() => setActiveTab('rewards')} className={`px-4 py-2 font-bold transition whitespace-nowrap ${activeTab === 'rewards' ? 'border-b-4 border-purple-500 text-purple-600' : 'text-gray-500 hover:text-purple-600'}`}>
          Reward Manager
        </button>
      </div>

      {/* --- 0. DASHBOARD TAB --- */}
      {activeTab === 'dashboard' && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Completed" value={stats.approvedCount} subtext={`${stats.pendingCount} proofs in queue`} icon={CheckCircle} colorClass="bg-emerald-50 text-emerald-600" />
                <StatCard title="Ecosystem XP" value={`⭐ ${stats.totalXP}`} subtext="Combined value of all impact" icon={Award} colorClass="bg-yellow-50 text-yellow-600" />
                <StatCard title="Business Redemptions" value={stats.redemptionCount} subtext="Partner value generated" icon={Gift} colorClass="bg-orange-50 text-orange-600" />
                <StatCard title="Registered Users" value={stats.userCount} subtext="Active SideQuest members" icon={UsersIcon} colorClass="bg-blue-50 text-blue-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                        <BarChart2 className="text-brand-600"/> Impact by Category
                    </h3>
                    <div className="space-y-4">
                        {Object.entries(stats.categories).map(([cat, count]) => (
                            <div key={cat}>
                                <div className="flex justify-between text-sm font-bold mb-1">
                                    <span>{cat}</span>
                                    <span>{count} Quests</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div 
                                        className="bg-brand-500 h-full rounded-full transition-all duration-1000" 
                                        style={{ width: `${stats.approvedCount > 0 ? (count / stats.approvedCount) * 100 : 0}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                {/* --- NEW LEADERBOARD COMPONENT --- */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-96">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-xl flex items-center gap-2 text-gray-800">
                            <UsersIcon className="text-brand-600" /> Top Adventurers
                        </h3>
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">
                            {users.length} Users
                        </span>
                    </div>
                    
                    <div className="overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        {users
                            // 1. Sort users by XP (Highest to Lowest)
                            .sort((a, b) => (b.xp || 0) - (a.xp || 0))
                            .map((user, index) => (
                            
                            <div key={user.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-brand-200 transition-colors group">
                                <div className="flex items-center gap-3">
                                    {/* Rank Badge */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${
                                        index === 0 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 
                                        index === 1 ? 'bg-gray-200 text-gray-700 border border-gray-300' : 
                                        index === 2 ? 'bg-orange-100 text-orange-800 border border-orange-200' : 'bg-white border text-gray-400'
                                    }`}>
                                        {index + 1}
                                    </div>
                                    
                                    {/* User Info */}
                                    <div>
                                        <p className="font-bold text-sm text-gray-900 leading-tight">
                                            {user.full_name || user.email.split('@')[0]}
                                        </p>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                                            {user.role}
                                        </p>
                                    </div>
                                </div>

                                {/* XP Badge */}
                                <div className="font-mono font-bold text-brand-600 bg-white px-2 py-1 rounded-lg border border-gray-100 text-xs shadow-sm group-hover:bg-brand-50 group-hover:border-brand-100 transition-colors">
                                    {user.xp || 0} XP
                                </div>
                            </div>
                        ))}
                        
                        {users.length === 0 && (
                            <p className="text-center text-gray-400 text-sm py-10">No users found.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- 1. PENDING SUBMISSIONS TAB --- */}
      {activeTab === 'submissions' && (
        <div className="space-y-6">
          {pendingSubmissions.length === 0 && <p className="text-gray-500 text-center py-20 bg-white rounded-xl border border-dashed">No pending proofs.</p>}
          {pendingSubmissions.map(progress => {
            const quest = quests.find(q => q.id === progress.quest_id);
            const traveler = users.find(u => u.id === progress.traveler_id);
            return (
              <div key={progress.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-800">{quest?.title}</h3>
                    <p className="text-sm text-gray-600">Traveler: {traveler?.email || 'Unknown'}</p>
                    <p className="text-sm text-gray-600 mt-1">XP to Award: <span className="font-bold text-green-600">{quest?.xp_value} XP</span></p>
                    <div className="mt-3 bg-gray-50 p-3 rounded">
                       <p className="text-sm font-medium text-gray-700">Submission Note:</p>
                       <p className="text-sm text-gray-600 mt-1 italic">"{progress.completion_note || 'No note provided'}"</p>
                       {progress.proof_photo_url && (
                            <div className="mt-2">
                               <p className="text-xs font-bold text-gray-500 mb-1">Proof Photo:</p>
                               <a href={progress.proof_photo_url} target="_blank" rel="noreferrer">
                                  <img src={progress.proof_photo_url} alt="Proof" className="h-40 w-auto rounded-lg border border-gray-300 shadow-sm object-cover" />
                               </a>
                            </div>
                       )}
                    </div>
                  </div>
                  <div className="flex gap-2 h-fit">
                    <button onClick={() => approveSubmission(progress.id)} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 font-medium transition">Approve</button>
                    <button onClick={() => rejectSubmission(progress.id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 font-medium transition">Reject</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- 2. PENDING NEW QUESTS TAB --- */}
      {activeTab === 'newQuests' && (
        <div className="space-y-6">
          {pendingNewQuests.length === 0 && <p className="text-gray-500 text-center py-20 bg-white rounded-xl border border-dashed">No new quests pending.</p>}
          {pendingNewQuests.map(quest => {
            const creator = users.find(u => u.id === quest.created_by);
            const isDetailsOpen = viewDetailsId === quest.id;
            return (
              <div key={quest.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex flex-col md:flex-row justify-between items-start">
                    <div className="flex-1 text-left">
                        <h3 className="font-bold text-lg text-gray-900">{quest.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">Submitted by: {creator?.email || 'Partner'}</p>
                        <p className="text-xs text-brand-700 font-medium mt-1">{quest.location_address}</p>
                    </div>
                    <div className="flex gap-2 mt-3 md:mt-0"><button onClick={() => setViewDetailsId(isDetailsOpen ? null : quest.id)} className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 font-medium transition flex items-center">
                            <Info size={18} className="mr-1"/> {isDetailsOpen ? 'Hide' : 'Details'}
                        </button>
                        {/* NEW EDIT BUTTON */}
                        <button onClick={() => setEditingId(editingId === quest.id ? null : quest.id)} className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg hover:bg-yellow-200 font-medium transition flex items-center">
                            <Edit size={18} className="mr-1"/> Edit
                        </button>
                        <button onClick={() => approveNewQuest(quest.id)} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 font-medium transition flex items-center"><Check size={18} className="mr-1"/> Approve</button>
                        <button onClick={() => deleteQuest(quest.id)} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 font-medium transition flex items-center"><Trash2 size={18} className="mr-1"/> Reject</button>
                    </div>
                </div>

                    {/* NEW EDIT FORM LOGIC */}
                {editingId === quest.id && (
                    <div className="mt-4">
                        <EditForm item={quest} onSave={handleSaveQuest} onCancel={() => setEditingId(null)} type="quest" />
                    </div>
                )}
                

                {isDetailsOpen && (
                    <div className="mt-4 pt-4 border-t border-gray-200 bg-white p-4 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                {quest.image && <img src={quest.image} alt="Quest" className="w-full h-48 object-cover rounded-lg border mb-4" />}
                                <div className="flex gap-2 mb-2">
                                    <span className="bg-brand-100 text-brand-800 text-xs px-2 py-1 rounded font-bold">{quest.category}</span>
                                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-bold">⭐ {quest.xp_value} XP</span>
                                </div>
                                <p className="text-xs text-gray-500">Coordinates: {quest.lat}, {quest.lng}</p>
                            </div>
                            <div className="space-y-3">
                                <div><h4 className="text-sm font-bold">Description</h4><p className="text-sm text-gray-600">{quest.description}</p></div>
                                <div><h4 className="text-sm font-bold">Instructions</h4><p className="text-sm text-gray-600">{quest.instructions}</p></div>
                                <div><h4 className="text-sm font-bold">Proof Requirements</h4><p className="text-sm text-gray-600">{quest.proof_requirements}</p></div>
                            </div>
                        </div>
                    </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* --- 3. PENDING NEW REWARDS TAB --- */}
      {activeTab === 'newRewards' && (
        <div className="space-y-4">
          {pendingNewRewards.length === 0 && <p className="text-gray-500 text-center py-20 bg-white rounded-xl border border-dashed">No new rewards pending.</p>}
          {pendingNewRewards.map(reward => {
             const creator = users.find(u => u.id === reward.created_by);
             const isDetailsOpen = viewDetailsId === reward.id;
             return (
                <div key={reward.id} className="border border-gray-200 rounded-xl bg-orange-50 overflow-hidden">
                    <div className="p-4 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            {reward.image && <img src={reward.image} alt="Reward" className="w-16 h-16 object-cover rounded-lg border shadow-sm"/>}
                            <div>
                                <div className="flex items-center gap-2"><Gift size={20} className="text-orange-600"/><h3 className="font-bold text-gray-800">{reward.title}</h3></div>
                                <p className="text-sm text-gray-600">Cost: {reward.xp_cost} XP | By: {creator?.email || 'Partner'}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setViewDetailsId(isDetailsOpen ? null : reward.id)} className="bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg font-medium hover:bg-orange-200">{isDetailsOpen ? 'Hide' : 'View Details'}</button>
                            {/* EDIT BUTTON */}
                            <button onClick={() => setEditingId(editingId === reward.id ? null : reward.id)} className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg flex items-center hover:bg-blue-200"><Edit size={16} /></button>
                            <button onClick={() => approveNewReward(reward.id)} className="bg-green-500 text-white px-3 py-1.5 rounded-lg flex items-center hover:bg-green-600 shadow-sm"><Check size={16} className="mr-1"/> Approve</button>
                            <button onClick={() => deleteReward(reward.id)} className="bg-red-500 text-white px-3 py-1.5 rounded-lg flex items-center hover:bg-red-600 shadow-sm"><Trash2 size={16} className="mr-1"/> Reject</button>
                        </div>
                    </div>

                    {/* EDIT FORM (Shows when Edit button is clicked) */}
                    {editingId === reward.id && (
                        <div className="p-4 bg-white border-t border-blue-200">
                            <EditForm item={reward} onSave={handleSaveReward} onCancel={() => setEditingId(null)} type="reward" />
                        </div>
                    )}

                    {/* DETAILS VIEW (Shows when View Details is clicked) */}
                    {isDetailsOpen && (
                        <div className="p-5 bg-white border-t border-orange-100 animate-in fade-in slide-in-from-top-2 duration-200">
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Reward Description</h4>
                            <p className="text-gray-700 leading-relaxed text-sm">{reward.description}</p>
                        </div>
                    )}
                </div>
             );
          })}
        </div>
      )}

      {/* --- 4. QUEST MANAGER TAB --- */}
      {activeTab === 'quests' && (
  <div className="space-y-4">
      {/* Title now reflects "Manageable" instead of just "Live" */}
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Quest Database ({manageableQuests.length})</h2>
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
      {manageableQuests.length === 0 ? (
          <p className="text-gray-400 italic">No quests found in database.</p>
      ) : (
          manageableQuests.map(quest => (
                    <div key={quest.id} className="border-b pb-4 last:border-0">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded border shadow-sm overflow-hidden bg-gray-100 flex-shrink-0">
                                    {quest.image ? (
                      <img src={quest.image + '?t=' + Date.now()} className="w-full h-full object-cover" alt="" />
                                      ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <MapPin size={18} />
                                       </div>
                                   )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">{quest.title}</h3>
                                    <p className="text-xs text-gray-500 flex items-center"><MapPin size={12} className="mr-1"/> {quest.location_address}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setEditingId(editingId === quest.id ? null : quest.id)} className="text-blue-500 hover:text-blue-700 p-2 rounded-full hover:bg-blue-50 transition-colors"><Edit size={18} /></button>
                                <button onClick={() => handleDeleteQuest(quest.id)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"><Trash2 size={18} /></button>
                            </div>
                        </div>
                        {editingId === quest.id && <EditForm item={quest} onSave={handleSaveQuest} onCancel={() => setEditingId(null)} type="quest" />}
                    </div>
                ))
            )}
            </div>
        </div>
      )}

      {/* --- 5. REWARD MANAGER TAB --- */}
      {activeTab === 'rewards' && (
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Database: Rewards ({rewards.length})</h2>
            {rewards.map(reward => (
                <div key={reward.id} className="border-b pb-4">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded border shadow-sm overflow-hidden bg-gray-100 flex-shrink-0">
    {reward.image ? (
        <img src={reward.image} className="w-full h-full object-cover" alt="" />
    ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Gift size={18} />
        </div>
    )}
</div>
                             <div><h3 className="font-bold text-lg text-gray-900">{reward.title}</h3><p className="text-xs text-gray-500 flex items-center"><Award size={12} className="mr-1"/> Cost: {reward.xp_cost} XP</p></div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setEditingId(editingId === reward.id ? null : reward.id)} className="text-blue-500 hover:text-blue-700 p-2 rounded-full hover:bg-blue-50"><Edit size={18} /></button>
                            <button onClick={() => handleDeleteReward(reward.id)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50"><Trash2 size={18} /></button>
                        </div>
                    </div>
                    {editingId === reward.id && <EditForm item={reward} onSave={handleSaveReward} onCancel={() => setEditingId(null)} type="reward" />}
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default Admin;