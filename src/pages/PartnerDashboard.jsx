// src/pages/PartnerDashboard.jsx
import React, { useState } from 'react';
import { PlusCircle, MapPin, Award, X, Menu } from 'lucide-react';
import { useSideQuest } from '../context/SideQuestContext';

const PartnerDashboard = () => {
    const { currentUser, addQuest, switchRole } = useSideQuest();
    const [form, setForm] = useState({ 
        title: '', description: '', category: 'Environmental', xp_value: 50, 
        location_address: '', image: '', lat: '', lng: '', instructions: '', proof_requirements: ''
    });
    const [status, setStatus] = useState('');

    if (currentUser?.role !== 'Partner') {
        return (
            <div className="p-12 text-center">
                <h2 className="text-2xl font-bold text-red-500 mb-4">Partner Access Required</h2>
                <p className="text-gray-600 mb-4">Switch to Partner role using the demo controls to add quests.</p>
                <button onClick={() => switchRole('Partner')} className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600">
                    (Demo) Switch to Partner
                </button>
            </div>
        );
    }

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.title || !form.location_address || !form.lat || !form.lng) {
            setStatus('Error: Please fill in Title, Location, Latitude, and Longitude.');
            return;
        }

        addQuest(form);
        setStatus(`Success! Quest "${form.title}" added and is now active.`);
        setForm({ 
            title: '', description: '', category: 'Environmental', xp_value: 50, 
            location_address: '', image: '', lat: '', lng: '', instructions: '', proof_requirements: ''
        });
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8 text-gray-900 flex items-center">
                <PlusCircle className="text-brand-600 mr-3" size={32} />
                Partner Dashboard: Add New Quest
            </h1>

            {status && (
                <div className={`p-4 mb-6 rounded-lg font-medium ${status.startsWith('Success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {status}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Quest Title</label>
                        <input type="text" name="title" value={form.title} onChange={handleChange} className="mt-1 w-full border p-3 rounded-lg focus:ring-brand-500 focus:border-brand-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <select name="category" value={form.category} onChange={handleChange} className="mt-1 w-full border p-3 rounded-lg focus:ring-brand-500 focus:border-brand-500">
                            <option value="Environmental">Environmental</option>
                            <option value="Social">Social</option>
                            <option value="Cultural">Cultural</option>
                            <option value="Animal Welfare">Animal Welfare</option>
                            <option value="Education">Education</option>
                            <option value="Economic">Economic</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea name="description" value={form.description} onChange={handleChange} rows="3" className="mt-1 w-full border p-3 rounded-lg focus:ring-brand-500 focus:border-brand-500" required />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">XP Value (30-100)</label>
                        <input type="number" name="xp_value" value={form.xp_value} onChange={handleChange} className="mt-1 w-full border p-3 rounded-lg" min="30" max="100" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Location Address (Display)</label>
                        <input type="text" name="location_address" value={form.location_address} onChange={handleChange} className="mt-1 w-full border p-3 rounded-lg" required />
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Latitude (Map Pin)</label>
                        <input type="text" name="lat" value={form.lat} onChange={handleChange} className="mt-1 w-full border p-3 rounded-lg" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Longitude (Map Pin)</label>
                        <input type="text" name="lng" value={form.lng} onChange={handleChange} className="mt-1 w-full border p-3 rounded-lg" required />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Image URL</label>
                    <input type="url" name="image" value={form.image} onChange={handleChange} className="mt-1 w-full border p-3 rounded-lg" placeholder="e.g., https://images.unsplash.com/..." />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Instructions (What the traveler does)</label>
                    <textarea name="instructions" value={form.instructions} onChange={handleChange} rows="2" className="mt-1 w-full border p-3 rounded-lg" required />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Proof Requirements (What the traveler submits)</label>
                    <input type="text" name="proof_requirements" value={form.proof_requirements} onChange={handleChange} className="mt-1 w-full border p-3 rounded-lg" required />
                </div>

                <button type="submit" className="w-full bg-brand-500 text-white py-3 rounded-lg font-bold hover:bg-brand-600 transition flex items-center justify-center">
                    <PlusCircle size={20} className="mr-2" /> Submit New Quest
                </button>
            </form>
        </div>
    );
};

export default PartnerDashboard;