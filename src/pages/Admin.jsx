import React, { useState } from 'react';
import { useSideQuest } from '../context/SideQuestContext';
import { PlusCircle, Clock, Edit, Trash2, Check, MapPin, Award } from 'lucide-react';

// Reusable Quest/Reward Edit Form (To manage state for the main forms)
const EditForm = ({ item, onSave, onCancel, type }) => {
    const [formData, setFormData] = useState(item);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const fields = type === 'quest' ? [
        { name: 'title', label: 'Title', type: 'text' },
        { name: 'xp_value', label: 'XP Value', type: 'number' },
        { name: 'location_address', label: 'Location', type: 'text' },
        { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'pending_admin'] },
        { name: 'image', label: 'Image URL', type: 'url' },
        { name: 'description', label: 'Description', type: 'textarea' },
    ] : [ // Reward Fields
        { name: 'title', label: 'Reward Title', type: 'text' },
        { name: 'xp_cost', label: 'XP Cost', type: 'number' },
        { name: 'description', label: 'Description', type: 'text' },
        { name: 'image', label: 'Image URL', type: 'url' },
    ];

    return (
        <form className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200 space-y-3" onSubmit={(e) => { e.preventDefault(); onSave(item.id, formData); }}>
            <h4 className="font-bold text-lg">{type === 'quest' ? 'Edit Quest' : 'Edit Reward'}</h4>
            
            {fields.map(field => (
                <div key={field.name}>
                    <label className="block text-xs font-medium text-gray-700">{field.label}</label>
                    {field.type === 'textarea' ? (
                        <textarea name={field.name} value={formData[field.name] || ''} onChange={handleChange} className="mt-1 w-full border p-2 rounded text-sm" rows="2" />
                    ) : field.type === 'select' ? (
                        <select name={field.name} value={formData[field.name] || ''} onChange={handleChange} className="mt-1 w-full border p-2 rounded text-sm">
                            {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    ) : (
                        <input type={field.type} name={field.name} value={formData[field.name] || ''} onChange={handleChange} className="mt-1 w-full border p-2 rounded text-sm" />
                    )}
                </div>
            ))}

            <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={onCancel} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm transition">Cancel</button>
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition">Save Changes</button>
            </div>
        </form>
    );
};


const Admin = () => {
  const { currentUser, questProgress, quests, rewards, users, approveSubmission, rejectSubmission, approveNewQuest, switchRole, updateQuest, deleteQuest, updateReward, deleteReward } = useSideQuest();
  const [activeTab, setActiveTab] = useState('submissions');
  const [editingId, setEditingId] = useState(null);

  if (currentUser?.role !== 'Admin') {
    return (
      <div className="p-12 text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Admin Access Only</h2>
        <button onClick={() => switchRole('Admin')} className="text-blue-500 underline">Demo: Switch to Admin Role</button>
      </div>
    );
  }

  const pendingSubmissions = questProgress.filter(p => p.status === 'pending');
  const pendingNewQuests = quests.filter(q => q.status === 'pending_admin');

  // Handlers for Quest/Reward Management
  const handleSaveQuest = (id, fields) => { updateQuest(id, fields); setEditingId(null); };
  const handleSaveReward = (id, fields) => { updateReward(id, fields); setEditingId(null); };
  
  const handleDeleteQuest = (id) => { if(window.confirm('Are you sure you want to delete this quest?')) deleteQuest(id); };
  const handleDeleteReward = (id) => { if(window.confirm('Are you sure you want to delete this reward?')) deleteReward(id); };


  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Content Management System</h1>

      {/* --- TAB NAVIGATION --- */}
      <div className="flex border-b mb-6">
        <button onClick={() => setActiveTab('submissions')} className={`px-6 py-3 font-semibold transition ${activeTab === 'submissions' ? 'border-b-4 border-yellow-500 text-yellow-600' : 'text-gray-500 hover:text-yellow-600'}`}>
          Proof Submissions ({pendingSubmissions.length})
        </button>
        <button onClick={() => setActiveTab('newQuests')} className={`px-6 py-3 font-semibold transition ${activeTab === 'newQuests' ? 'border-b-4 border-brand-500 text-brand-600' : 'text-gray-500 hover:text-brand-600'}`}>
          New Quests ({pendingNewQuests.length})
        </button>
        <button onClick={() => setActiveTab('quests')} className={`px-6 py-3 font-semibold transition ${activeTab === 'quests' ? 'border-b-4 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}>
          Quest Manager
        </button>
        <button onClick={() => setActiveTab('rewards')} className={`px-6 py-3 font-semibold transition ${activeTab === 'rewards' ? 'border-b-4 border-orange-500 text-orange-600' : 'text-gray-500 hover:text-orange-600'}`}>
          Reward Manager
        </button>
      </div>


      {/* -------------------- TAB CONTENT -------------------- */}


      {/* --- PENDING SUBMISSIONS TAB --- */}
      {activeTab === 'submissions' && (
        <div className="space-y-6">
          {pendingSubmissions.length === 0 ? <p className="text-gray-500">No traveler proof pending review.</p> : (
            <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
              {pendingSubmissions.map(progress => {
                const quest = quests.find(q => q.id === progress.quest_id);
                const traveler = users.find(u => u.id === progress.traveler_id);
                return (
                  <div key={progress.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      {/* ... Submission Details ... */}
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-800">{quest?.title}</h3>
                        <p className="text-sm text-gray-600">Traveler: {traveler?.email || 'Unknown'}</p>
                        <p className="text-sm text-gray-600 mt-1">XP to Award: <span className="font-bold text-green-600">{quest?.xp_value} XP</span></p>
                        <div className="mt-3 bg-gray-50 p-3 rounded">
                          <p className="text-sm font-medium text-gray-700">Submission Note:</p>
                          <p className="text-sm text-gray-600 mt-1">{progress.completion_note || 'No note provided'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 h-fit">
                        <button onClick={() => approveSubmission(progress.id)} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 font-medium transition">Approve</button>
                        <button onClick={() => rejectSubmission(progress.id)} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 font-medium transition">Reject</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}


      {/* --- PENDING NEW QUESTS TAB --- */}
      {activeTab === 'newQuests' && (
        <div className="space-y-6">
          {pendingNewQuests.length === 0 ? <p className="text-gray-500">No new quests pending review.</p> : (
            <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
              {pendingNewQuests.map(quest => {
                const creator = users.find(u => u.id === quest.created_by_id);
                return (
                  <div key={quest.id} className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row justify-between items-center bg-gray-50">
                    <div className="flex-1 text-left">
                      <h3 className="font-bold text-lg text-gray-900">{quest.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">By: {creator?.email || 'Unknown Partner'}</p>
                      <p className="text-xs text-brand-700 font-medium">{quest.location_address}</p>
                    </div>
                    <div className="flex gap-2 mt-3 md:mt-0">
                      <button onClick={() => approveNewQuest(quest.id)} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 font-medium transition flex items-center"><Check size={18} className="mr-1"/> Approve</button>
                      <button onClick={() => deleteQuest(quest.id)} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 font-medium transition flex items-center"><Trash2 size={18} className="mr-1"/> Reject</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}


      {/* --- QUEST MANAGER TAB --- */}
      {activeTab === 'quests' && (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Total Active Quests ({quests.filter(q => q.status === 'active').length})</h2>
            <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
            {quests.map(quest => (
                <div key={quest.id} className="border-b pb-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-lg text-gray-900">{quest.title}</h3>
                            <p className="text-xs text-gray-500 flex items-center"><MapPin size={12} className="mr-1"/> {quest.location_address} - <span className="ml-1 font-semibold text-brand-600">({quest.status})</span></p>
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


      {/* --- REWARD MANAGER TAB --- */}
      {activeTab === 'rewards' && (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Total Rewards ({rewards.length})</h2>
            <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
            {rewards.map(reward => (
                <div key={reward.id} className="border-b pb-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-lg text-gray-900">{reward.title}</h3>
                            <p className="text-xs text-gray-500 flex items-center"><Award size={12} className="mr-1"/> Cost: {reward.xp_cost} XP</p>
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