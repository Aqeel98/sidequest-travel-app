import React, { useState, useEffect } from 'react';
import { PlusCircle, UploadCloud, Gift, Map } from 'lucide-react';
import { useSideQuest } from '../context/SideQuestContext';

const PartnerDashboard = () => {
    const { currentUser, addQuest, addReward, switchRole } = useSideQuest();
    
    // Toggle Mode: 'quest' or 'reward'
    const [mode, setMode] = useState('quest');

    // States
    const [form, setForm] = useState({});
    const [imageFile, setImageFile] = useState(null); 
    const [preview, setPreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        return () => { if (preview) URL.revokeObjectURL(preview); };
    }, [preview]);

    // Access Check
    if (currentUser?.role !== 'Partner' && currentUser?.role !== 'Admin') {
        return (
            <div className="p-12 text-center">
                <h2 className="text-2xl font-bold text-red-500 mb-4">Partner Access Required</h2>
                <button onClick={() => switchRole('Partner')} className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600">
                    (Demo) Switch to Partner Role
                </button>
            </div>
        );
    }

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreview(URL.createObjectURL(file)); 
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!form.title || !imageFile) {
            alert("Please fill in title and upload an image.");
            return;
        }

        setIsSubmitting(true);

        try {
            let success = false;
            if (mode === 'quest') {
                if (!form.lat || !form.lng) {
                    alert("Coordinates required for Quest.");
                    setIsSubmitting(false); 
                    return;
                }
                success = await addQuest(form, imageFile);
            } else {
                if (!form.xp_cost) {
                    alert("XP Cost required for Reward.");
                    setIsSubmitting(false); 
                    return;
                }
                success = await addReward(form, imageFile);
            }

            // If the context action was successful, clear the form
            if (success) {
                setForm({});
                setImageFile(null);
                setPreview(null);
            }
        } catch (error) {
            console.error("Submission error:", error);
            alert("An unexpected error occurred. Check console for details.");
        } finally {
            // THIS IS THE FIX: This line runs NO MATTER WHAT. 
            // Even if the upload fails or the database rejects it, 
            // the button will stop saying "Uploading..."
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8 text-gray-900 flex items-center">
                <PlusCircle className="text-brand-600 mr-3" size={32} />
                Partner Dashboard
            </h1>

            {/* TOGGLE TABS */}
            <div className="flex gap-4 mb-8">
                <button onClick={() => setMode('quest')} className={`flex-1 py-4 rounded-xl border-2 flex items-center justify-center font-bold text-lg transition ${mode === 'quest' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    <Map className="mr-2" /> Add Quest
                </button>
                <button onClick={() => setMode('reward')} className={`flex-1 py-4 rounded-xl border-2 flex items-center justify-center font-bold text-lg transition ${mode === 'reward' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    <Gift className="mr-2" /> Add Reward
                </button>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg space-y-6">
                
                {/* 1. Common Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{mode === 'quest' ? 'Quest Title' : 'Reward Title'}</label>
                        <input type="text" name="title" value={form.title || ''} onChange={handleChange} className="w-full border p-3 rounded-lg" required />
                    </div>
                    {mode === 'quest' && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                            <select name="category" value={form.category || 'Environmental'} onChange={handleChange} className="w-full border p-3 rounded-lg">
                                <option>Environmental</option>
                                <option>Social</option>
                                <option>Cultural</option>
                                <option>Animal Welfare</option>
                                <option>Education</option>
                            </select>
                        </div>
                    )}
                    {mode === 'reward' && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">XP Cost</label>
                            <input type="number" name="xp_cost" value={form.xp_cost || ''} onChange={handleChange} className="w-full border p-3 rounded-lg" required />
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                    <textarea name="description" value={form.description || ''} onChange={handleChange} rows="3" className="w-full border p-3 rounded-lg" required />
                </div>

                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Cover Image</label>
                    <div className="flex items-center gap-4">
                        <label className="cursor-pointer bg-gray-50 border-2 border-dashed border-gray-300 px-6 py-4 rounded-lg hover:bg-gray-100 flex flex-col items-center">
                            <UploadCloud className="text-gray-400 mb-1" />
                            <span className="text-sm text-gray-500">Click to Upload</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                        </label>
                        {preview && (
                            <img src={preview} alt="Preview" className="h-20 w-20 object-cover rounded-lg border shadow-sm" />
                        )}
                    </div>
                </div>
                
                {/* QUEST SPECIFIC FIELDS */}
                {mode === 'quest' && (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">XP Value</label>
                                <input type="number" name="xp_value" value={form.xp_value || 50} onChange={handleChange} className="w-full border p-3 rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Display Address</label>
                                <input type="text" name="location_address" value={form.location_address || ''} onChange={handleChange} className="w-full border p-3 rounded-lg" required />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Latitude</label>
                                <input type="number" step="any" name="lat" value={form.lat || ''} onChange={handleChange} className="w-full border p-2 rounded" placeholder="e.g. 6.0535" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Longitude</label>
                                <input type="number" step="any" name="lng" value={form.lng || ''} onChange={handleChange} className="w-full border p-2 rounded" placeholder="e.g. 80.2084" required />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Instructions</label>
                            <textarea name="instructions" value={form.instructions || ''} onChange={handleChange} rows="2" className="w-full border p-3 rounded-lg" required />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Proof Requirements</label>
                            <input type="text" name="proof_requirements" value={form.proof_requirements || ''} onChange={handleChange} className="w-full border p-3 rounded-lg" required />
                        </div>
                    </>
                )}

                <button type="submit" disabled={isSubmitting} className={`w-full text-white py-4 rounded-lg font-bold text-lg transition flex items-center justify-center shadow-lg ${mode === 'quest' ? 'bg-brand-600 hover:bg-brand-700' : 'bg-orange-500 hover:bg-orange-600'}`}>
                    {isSubmitting ? 'Uploading...' : <><PlusCircle size={20} className="mr-2" /> {mode === 'quest' ? 'Create Quest' : 'Create Reward'}</>}
                </button>
            </form>
        </div>
    );
};

export default PartnerDashboard;