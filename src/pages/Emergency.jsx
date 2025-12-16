// src/pages/Emergency.jsx

import React from 'react';
// Using only the most stable and reliable icons: AlertCircle, Phone, MapPin, Shield, Siren, Home
import { HeartPulse, Phone, MapPin, Shield, Siren, AlertCircle } from 'lucide-react'; 

const Emergency = () => {
    
    // Static data for the pilot region (Colombo to Matara)
    const emergencyContacts = [
        { name: "Police Emergency", number: "119 / 118", icon: <Shield size={20} />, color: 'text-red-600' },
        { name: "Ambulance / Fire", number: "110", icon: <Siren size={20} />, color: 'text-red-600' }, 
        { name: "Tourist Police ", number: "1912 / +94 11 242 1052", icon: <MapPin size={20} />, color: 'text-blue-600' },
    ];

    const hospitalLocations = [
        // Using AlertCircle for a clear warning/aid symbol
        { name: "Colombo National Hospital", address: "Regarded as the best public hospital for emergencies.", type: "Public", contact: "+94 11 269 3671" },
        { name: "Lanka Hospitals (Private)", address: "Colombo 05. Reliable private option.", type: "Private", contact: "+94 11 533 0000" },
        { name: "Galle Karapitiya Teaching Hospital", address: "Largest public hospital on the South Coast.", type: "Public", contact: "+94 91 223 2261" },
        { name: "Matara General Hospital", address: "Main public hospital for Matara region.", type: "Public", contact: "+94 41 222 2261" },
    ];

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-extrabold mb-4 text-gray-900 flex items-center">
                <HeartPulse className="text-red-600 mr-3" size={32} />
                Emergency & Safety Info
            </h1>
            <p className="text-lg text-gray-500 mb-10">Crucial contacts and locations for a safe journey in the South Coast pilot region.</p>

            {/* --- EMERGENCY CONTACTS --- */}
            <div className="mb-10">
                <h2 className="text-2xl font-bold mb-5 text-gray-800 border-b pb-2">Essential Contacts</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {emergencyContacts.map(contact => (
                        <div key={contact.name} className="bg-white rounded-xl shadow-md p-5 flex flex-col items-center text-center border-t-4 border-red-500">
                            <div className={`mb-3 ${contact.color}`}>{contact.icon}</div>
                            <p className="text-sm font-semibold text-gray-500">{contact.name}</p>
                            <p className="text-xl font-extrabold text-red-600 mt-1">{contact.number}</p>
                            <a href={`tel:${contact.number.split('/')[0].trim()}`} className="mt-3 text-sm text-blue-500 hover:underline flex items-center">
                                <Phone size={16} className="mr-1"/> Call Now
                            </a>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- HOSPITAL LOCATIONS --- */}
            <div>
                <h2 className="text-2xl font-bold mb-5 text-gray-800 border-b pb-2 flex items-center">
                   <AlertCircle className="mr-2 text-brand-600" size={24}/> Key Hospitals in Pilot Region
                </h2>
                <div className="space-y-4">
                    {hospitalLocations.map(h => (
                        <div key={h.name} className="bg-white rounded-xl shadow-md p-5 flex justify-between items-start border-l-4 border-brand-400">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">{h.name}</h3>
                                <p className="text-sm text-gray-600 mt-1">{h.address}</p>
                            </div>
                            <div className="text-right">
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${h.type === 'Public' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{h.type}</span>
                                <a href={`tel:${h.contact}`} className="block mt-2 text-sm text-red-500 hover:underline flex items-center">
                                    <Phone size={14} className="mr-1"/> {h.contact}
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- Safety Disclaimer --- */}
            <div className="mt-12 p-5 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-gray-700 font-medium">Safety Tip: Always have your travel insurance details and passport copy with you. In an extreme emergency, contact your embassy first.</p>
            </div>

        </div>
    );
};

export default Emergency;