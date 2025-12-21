import React, { useState, useEffect } from 'react';
import { useSideQuest } from '../context/SideQuestContext';
import { supabase } from '../supabaseClient'; 
import { PlusCircle, Edit, Trash2, Check, MapPin, Award, UploadCloud, Info, Gift } from 'lucide-react';

// --- EDIT FORM COMPONENT (With File Upload & Memory Cleanup) ---
const EditForm = ({ item, onSave, onCancel, type }) => {
    const [formData, setFormData] = useState(item);
    const [uploading, setUploading] = useState(false);
    
    // Initialize preview with the existing image or null
    const [previewUrl, setPreviewUrl] = useState(item.image || null);

    // 1. CLEANUP EFFECT: Prevents browser memory leaks from object URLs
    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    // 2. RESET EFFECT: Updates preview if you switch between items
    useEffect(() => {
        setPreviewUrl(item.image || null);
        setFormData(item);
    }, [item.id, item.image]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- HANDLE IMAGE UPLOAD ---
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // A. Create Local Preview immediately (Fast Feedback)
        const localPreview = URL.createObjectURL(file);
        setPreviewUrl(localPreview); 

        setUploading(true);
        try {
            // B. Upload to Supabase Storage
            const fileName = `admin-uploads/${Date.now()}_${file.name.replace(/\s/g, '')}`;
            const { error: uploadError } = await supabase.storage.from('proofs').upload(fileName, file);
            
            if (uploadError) throw uploadError;

            // C. Get Public URL
            const { data } = supabase.storage.from('proofs').getPublicUrl(fileName);
            
            // D. Update Form Data (This is what gets saved to DB)
            setFormData(prev => ({ ...prev, image: data.publicUrl }));
            alert("Image uploaded successfully!");
            
        } catch (error) {
            console.error(error);
            setPreviewUrl(item.image || null); // Revert on error
            alert("Upload failed: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    // Fields definition based on type (Quest or Reward)
    const fields = type === 'quest' ? [
        { name: 'title', label: 'Title', type: 'text' },
        { name: 'xp_value', label: 'XP Value', type: 'number' },
        { name: 'location_address', label: 'Location', type: 'text' },
        { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'pending_admin'] },
        { name: 'description', label: 'Description', type: 'textarea' },
    ] : [ 
        { name: 'title', label: 'Reward Title', type: 'text' },
        { name: 'xp_cost', label: 'XP Cost', type: 'number' },
        { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'pending_admin'] },
        { name: 'description', label: 'Description', type: 'textarea' },
    ];

    return (
        <form className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200 space-y-3" onSubmit={(e) => { e.preventDefault(); onSave(item.id, formData); }}>
            <h4 className="font-bold text-lg">{type === 'quest' ? 'Edit Quest' : 'Edit Reward'}</h4>
            
            {/* Dynamic Text Inputs */}
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
                        <input type={field.type} name={field.name} value={formData[field.name] || ''} onChange={handleChange} className="mt-1 w-full border p-2 rounded text-sm" />
                    )}
                </div>
            ))}

            {/* --- IMAGE UPLOADER --- */}
            <div className="border-t pt-2 mt-2">
                <label className="block text-xs font-medium text-gray-700 mb-2">Quest/Reward Image</label>
                <div className="flex items-center gap-4">
                    {previewUrl && (
                        <img src={previewUrl} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-gray-300" />
                    )}
                    
                    <label className={`cursor-pointer bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center transition-all shadow-sm ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <UploadCloud size={18} className="mr-2 text-brand-600" />
                        {uploading ? "Uploading..." : "Click to Change Photo"}
                        <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleImageUpload} 
                            disabled={uploading} 
                        />
                    </label>
                </div>
                {/* Hidden input to ensure image URL is submitted */}
                <input type="hidden" name="image" value={formData.image || ''} />
            </div>

            <div className="flex gap-3 justify-end pt-4">
                <button type="button" onClick={onCancel} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm transition">Cancel</button>
                <button type="submit" disabled={uploading} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition font-bold shadow">
                    {uploading ? 'Wait...' : 'Save Changes'}
                </button>
            </div>
        </form>
    );
};

// --- MAIN ADMIN DASHBOARD ---
const Admin = () => {
  const { currentUser, questProgress, quests, rewards, users, approveSubmission, rejectSubmission, approveNewQuest, approveNewReward, updateQuest, deleteQuest, updateReward, deleteReward } = useSideQuest();
  const [activeTab, setActiveTab] = useState('submissions');
  const [editingId, setEditingId] = useState(null);
  const [viewDetailsId, setViewDetailsId] = useState(null); // For expanding quest details

  if (currentUser?.role !== 'Admin') {
    return (
      <div className="p-12 text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Admin Access Only</h2>
        <p className="text-gray-600">Please log in with an Admin account.</p>
        <p className="text-sm text-gray-400 mt-2">(Tip: Change your role to 'Admin' in the Supabase Database)</p>
      </div>
    );
  }

  const pendingSubmissions = questProgress.filter(p => p.status === 'pending');
  const pendingNewQuests = quests.filter(q => q.status === 'pending_admin');
  const pendingNewRewards = rewards.filter(r => r.status === 'pending_admin');

  // Handlers
  const handleSaveQuest = (id, fields) => { updateQuest(id, fields); setEditingId(null); };
  const handleSaveReward = (id, fields) => { updateReward(id, fields); setEditingId(null); };
  const handleDeleteQuest = (id) => { if(window.confirm('Are you sure you want to delete this quest?')) deleteQuest(id); };
  const handleDeleteReward = (id) => { if(window.confirm('Are you sure you want to delete this reward?')) deleteReward(id); };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">All Access</h1>

      {/* --- TAB NAVIGATION --- */}
      <div className="flex border-b mb-6 overflow-x-auto gap-2 pb-2">
        <button onClick={() => setActiveTab('submissions')} className={`px-4 py-2 font-semibold transition whitespace-nowrap ${activeTab === 'submissions' ? 'border-b-4 border-yellow-500 text-yellow-600' : 'text-gray-500 hover:text-yellow-600'}`}>
          Proof Submissions ({pendingSubmissions.length})
        </button>
        <button onClick={() => setActiveTab('newQuests')} className={`px-4 py-2 font-semibold transition whitespace-nowrap ${activeTab === 'newQuests' ? 'border-b-4 border-brand-500 text-brand-600' : 'text-gray-500 hover:text-brand-600'}`}>
          New Quests ({pendingNewQuests.length})
        </button>
        <button onClick={() => setActiveTab('newRewards')} className={`px-4 py-2 font-semibold transition whitespace-nowrap ${activeTab === 'newRewards' ? 'border-b-4 border-orange-500 text-orange-600' : 'text-gray-500 hover:text-orange-600'}`}>
          New Rewards ({pendingNewRewards.length})
        </button>
        <button onClick={() => setActiveTab('quests')} className={`px-4 py-2 font-semibold transition whitespace-nowrap ${activeTab === 'quests' ? 'border-b-4 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}>
          Quest Manager
        </button>
        <button onClick={() => setActiveTab('rewards')} className={`px-4 py-2 font-semibold transition whitespace-nowrap ${activeTab === 'rewards' ? 'border-b-4 border-purple-500 text-purple-600' : 'text-gray-500 hover:text-orange-600'}`}>
          Reward Manager
        </button>
      </div>

      {/* --- 1. PENDING SUBMISSIONS TAB --- */}
      {activeTab === 'submissions' && (
        <div className="space-y-6">
          {pendingSubmissions.length === 0 && <p className="text-gray-500">No pending proofs.</p>}
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
                       <p className="text-sm text-gray-600 mt-1">{progress.completion_note || 'No note provided'}</p>
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

      {/* --- 2. PENDING NEW QUESTS TAB (WITH DETAILS TOGGLE) --- */}
      {activeTab === 'newQuests' && (
        <div className="space-y-6">
          {pendingNewQuests.length === 0 && <p className="text-gray-500">No new quests pending.</p>}
          {pendingNewQuests.map(quest => {
           
           const creator = users.find(u => u.id === quest.created_by);
            const isDetailsOpen = viewDetailsId === quest.id;

            return (
              <div key={quest.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex flex-col md:flex-row justify-between items-start">
                    <div className="flex-1 text-left">
                        <h3 className="font-bold text-lg text-gray-900">{quest.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">Submitted by: {creator?.email || 'Unknown Partner'}</p>
                        <p className="text-xs text-brand-700 font-medium mt-1">{quest.location_address}</p>
                    </div>
                    <div className="flex gap-2 mt-3 md:mt-0">
                        {/* View Details Button */}
                        <button 
                            onClick={() => setViewDetailsId(isDetailsOpen ? null : quest.id)} 
                            className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 font-medium transition flex items-center"
                        >
                            <Info size={18} className="mr-1"/> {isDetailsOpen ? 'Hide' : 'Details'}
                        </button>
                        <button onClick={() => approveNewQuest(quest.id)} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 font-medium transition flex items-center"><Check size={18} className="mr-1"/> Approve</button>
                        <button onClick={() => deleteQuest(quest.id)} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 font-medium transition flex items-center"><Trash2 size={18} className="mr-1"/> Reject</button>
                    </div>
                </div>

                {/* EXPANDABLE DETAILS PANEL */}
                {isDetailsOpen && (
                    <div className="mt-4 pt-4 border-t border-gray-200 bg-white p-4 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                {quest.image && (
                                    <img src={quest.image} alt="Quest" className="w-full h-48 object-cover rounded-lg border mb-4" />
                                )}
                                <div className="flex gap-2 mb-2">
                                    <span className="bg-brand-100 text-brand-800 text-xs px-2 py-1 rounded font-bold">{quest.category}</span>
                                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-bold">⭐ {quest.xp_value} XP</span>
                                </div>
                                <p className="text-xs text-gray-500 mb-2">Coordinates: {quest.lat}, {quest.lng}</p>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900">Description</h4>
                                    <p className="text-sm text-gray-600">{quest.description}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900">Instructions</h4>
                                    <p className="text-sm text-gray-600">{quest.instructions}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900">Proof Requirements</h4>
                                    <p className="text-sm text-gray-600">{quest.proof_requirements}</p>
                                </div>
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
          {pendingNewRewards.length === 0 && <p className="text-gray-500">No new rewards pending.</p>}
          {pendingNewRewards.map(reward => {
             const creator = users.find(u => u.id === reward.created_by);
             return (
                <div key={reward.id} className="border p-4 rounded-lg bg-orange-50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        {reward.image && <img src={reward.image} alt="Reward" className="w-16 h-16 object-cover rounded-lg border"/>}
                        <div>
                            <div className="flex items-center gap-2">
                                <Gift size={20} className="text-orange-600"/>
                                <h3 className="font-bold text-gray-800">{reward.title}</h3>
                            </div>
                            <p className="text-sm text-gray-600">Cost: {reward.xp_cost} XP | By: {creator?.email || 'Unknown'}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => approveNewReward(reward.id)} className="bg-green-500 text-white px-3 py-1 rounded flex items-center hover:bg-green-600"><Check size={16} className="mr-1"/> Approve</button>
                        <button onClick={() => deleteReward(reward.id)} className="bg-red-500 text-white px-3 py-1 rounded flex items-center hover:bg-red-600"><Trash2 size={16} className="mr-1"/> Reject</button>
                    </div>
                </div>
             );
          })}
        </div>
      )}

      {/* --- 4. QUEST MANAGER TAB --- */}
      {activeTab === 'quests' && (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Total Active Quests ({quests.filter(q => q.status === 'active').length})</h2>
            <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
            {quests.map(quest => (
                <div key={quest.id} className="border-b pb-4">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                          <img 
                           // Cache buster logic for instant updates
                           src={(quest.image ? quest.image + '?t=' + Date.now() : "https://via.placeholder.com/50")} 
                            className="w-12 h-12 rounded object-cover border" 
                            alt="thumbnail" 
                          />
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">{quest.title}</h3>
                                <p className="text-xs text-gray-500 flex items-center"><MapPin size={12} className="mr-1"/> {quest.location_address}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setEditingId(editingId === quest.id ? null : quest.id)} className="text-blue-500 hover:text-blue-700 p-2 rounded-full hover:bg-blue-50"><Edit size={18} /></button>
                            <button onClick={() => handleDeleteQuest(quest.id)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50"><Trash2 size={18} /></button>
                        </div>
                    </div>
                    {editingId === quest.id && <EditForm item={quest} onSave={handleSaveQuest} onCancel={() => setEditingId(null)} type="quest" />}
                </div>
            ))}
            </div>
        </div>
      )}

      {/* --- 5. REWARD MANAGER TAB --- */}
      {activeTab === 'rewards' && (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Total Rewards ({rewards.length})</h2>
            <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
            {rewards.map(reward => (
                <div key={reward.id} className="border-b pb-4">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                             <img src={reward.image || "https://via.placeholder.com/50"} className="w-12 h-12 rounded object-cover border" alt="thumbnail" />
                             <div>
                                <h3 className="font-bold text-lg text-gray-900">{reward.title}</h3>
                                <p className="text-xs text-gray-500 flex items-center"><Award size={12} className="mr-1"/> Cost: {reward.xp_cost} XP</p>
                             </div>
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
        </div>
      )}
    </div>
  );
};

export default Admin;