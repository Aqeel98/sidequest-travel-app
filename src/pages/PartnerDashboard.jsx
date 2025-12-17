import React, { useState } from 'react';
import { PlusCircle, UploadCloud } from 'lucide-react';
import { useSideQuest } from '../context/SideQuestContext';

const PartnerDashboard = () => {
    const { currentUser, addQuest, switchRole } = useSideQuest();
    
    // Form State
    const [form, setForm] = useState({ 
        title: '', description: '', category: 'Environmental', xp_value: 50, 
        location_address: '', lat: '', lng: '', instructions: '', proof_requirements: ''
    });
    const [imageFile, setImageFile] = useState(null); // Separate state for the file
    const [preview, setPreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    // Handle Text Inputs
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // Handle File Selection
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreview(URL.createObjectURL(file)); // Show preview instantly
        }
    };

    // Handle Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic Validation
        if (!form.title || !form.lat || !form.lng || !imageFile) {
            alert("Please fill in all fields and upload an image.");
            return;
        }

        setIsSubmitting(true);
        
        // Call Context Function
        const success = await addQuest(form, imageFile);
        
        setIsSubmitting(false);

        if (success) {
            // Reset Form
            setForm({ 
                title: '', description: '', category: 'Environmental', xp_value: 50, 
                location_address: '', lat: '', lng: '', instructions: '', proof_requirements: ''
            });
            setImageFile(null);
            setPreview(null);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8 text-gray-900 flex items-center">
                <PlusCircle className="text-brand-600 mr-3" size={32} />
                Add New Quest
            </h1>

            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg space-y-6">
                
                {/* 1. Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Quest Title</label>
                        <input type="text" name="title" value={form.title} onChange={handleChange} className="w-full border p-3 rounded-lg" required />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                        <select name="category" value={form.category} onChange={handleChange} className="w-full border p-3 rounded-lg">
                            <option>Environmental</option>
                            <option>Social</option>
                            <option>Cultural</option>
                            <option>Animal Welfare</option>
                            <option>Education</option>
                        </select>
                    </div>
                </div>

                {/* 2. Description */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                    <textarea name="description" value={form.description} onChange={handleChange} rows="3" className="w-full border p-3 rounded-lg" required />
                </div>

                {/* 3. Image Upload */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Quest Cover Image</label>
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
                
                {/* 4. Location & XP */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">XP Value</label>
                        <input type="number" name="xp_value" value={form.xp_value} onChange={handleChange} className="w-full border p-3 rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Display Address</label>
                        <input type="text" name="location_address" value={form.location_address} onChange={handleChange} className="w-full border p-3 rounded-lg" placeholder="e.g. Mirissa Beach" />
                    </div>
                </div>

                {/* 5. Coordinates */}
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Latitude</label>
                        <input type="number" step="any" name="lat" value={form.lat} onChange={handleChange} className="w-full border p-2 rounded" placeholder="e.g. 6.0535" required />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Longitude</label>
                        <input type="number" step="any" name="lng" value={form.lng} onChange={handleChange} className="w-full border p-2 rounded" placeholder="e.g. 80.2084" required />
                    </div>
                    <p className="col-span-2 text-xs text-blue-500 cursor-pointer" onClick={() => window.open('https://www.google.com/maps', '_blank')}>
                        Tip: Right-click on Google Maps to get these numbers.
                    </p>
                </div>

                {/* 6. Instructions */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Instructions</label>
                    <textarea name="instructions" value={form.instructions} onChange={handleChange} rows="2" className="w-full border p-3 rounded-lg" placeholder="What should they do?" required />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Proof Requirements</label>
                    <input type="text" name="proof_requirements" value={form.proof_requirements} onChange={handleChange} className="w-full border p-3 rounded-lg" placeholder="What photo should they take?" required />
                </div>

                {/* Submit Button */}
                <button type="submit" disabled={isSubmitting} className="w-full bg-brand-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-brand-700 transition flex items-center justify-center shadow-lg">
                    {isSubmitting ? 'Uploading & Creating...' : <><PlusCircle size={20} className="mr-2" /> Create Quest</>}
                </button>
            </form>
        </div>
    );
};

export default PartnerDashboard;