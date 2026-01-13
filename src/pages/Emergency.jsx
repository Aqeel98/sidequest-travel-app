// src/pages/Emergency.jsx

import React from 'react';
// Using only the most stable and reliable icons
import { HeartPulse, Phone, MapPin, Shield, Siren, AlertCircle } from 'lucide-react'; 

const Emergency = () => {
    
    // Static data for National Coverage
    const emergencyContacts = [
        { name: "Police Emergency", number: "119 / 118", icon: <Shield size={20} />, color: 'text-red-600' },
        { name: "Ambulance / Fire", number: "110", icon: <Siren size={20} />, color: 'text-red-600' }, 
        { name: "Suwa Seriya Ambulance", number: "1990 ", icon: <Siren size={20} />, color: 'text-red-600' }, 
        { name: "Tourist Police", number: "1912 / +94 11 242 1052", icon: <MapPin size={20} />, color: 'text-blue-600' },
    ];

    const hospitalLocations = [
        // --- WESTERN (Capital) ---
        { name: "Colombo National Hospital", region: "Colombo (West)", address: "Regarded as the best public hospital for trauma.", type: "Public", contact: "+94 11 269 1111" },
        { name: "Lanka Hospitals", region: "Colombo (West)", address: "Reliable private option in Colombo.", type: "Private", contact: "+94 11 543 0000" },
        
        // --- SOUTHERN (Galle/Matara) ---
        { name: "Karapitiya Teaching Hospital", region: "Galle (South)", address: "Largest tertiary care center in the South.", type: "Public", contact: "+94 91 223 2176" },
        
        // --- CENTRAL (Kandy/Tea Country) ---
        { name: "Kandy National Hospital", region: "Kandy (Central)", address: "Main hub for Pekoe Trail & Knuckles region.", type: "Public", contact: "+94 81 222 2261" },
        
        // --- UVA (Ella/Badulla) ---
        { name: "Badulla General Hospital", region: "Ella/Badulla (Hill Country)", address: "Closest major hospital for Ella & Diyaluma.", type: "Public", contact: "+94 55 222 2261" },

        // --- NORTHERN (Jaffna) ---
        { name: "Jaffna Teaching Hospital", region: "Jaffna (North)", address: "Main hospital for Delft & Point Pedro.", type: "Public", contact: "+94 21 222 2261" },

        // --- EASTERN (Trinco) ---
        { name: "Trincomalee General Hospital", region: "Trincomalee (East)", address: "Primary care for Pigeon Island/Nilaveli.", type: "Public", contact: "+94 26 222 2261" },

        // --- NORTH CENTRAL (Safari Zone) ---
        { name: "Anuradhapura Teaching Hospital", region: "Anuradhapura (Safari Zone)", address: "Hub for Wilpattu & Ritigala.", type: "Public", contact: "+94 25 222 2261" },
    ];

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-extrabold mb-4 text-gray-900 flex items-center">
                <HeartPulse className="text-red-600 mr-3" size={32} />
                Emergency & Safety Info
            </h1>
            {/* Updated Text */}
            <p className="text-lg text-gray-500 mb-10">Crucial contacts and locations for a safe journey across <strong>all districts of Sri Lanka</strong>.</p>

            {/* --- EMERGENCY CONTACTS --- */}
            <div className="mb-10">
                <h2 className="text-2xl font-bold mb-5 text-gray-800 border-b pb-2">Essential Contacts</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {emergencyContacts.map(contact => (
                        <div key={contact.name} className="bg-white rounded-xl shadow-md p-5 flex flex-col items-center text-center border-t-4 border-red-500">
                            <div className={`mb-3 ${contact.color}`}>{contact.icon}</div>
                            <p className="text-sm font-semibold text-gray-500">{contact.name}</p>
                            <p className="text-lg font-extrabold text-red-600 mt-1">{contact.number}</p>
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
                   <AlertCircle className="mr-2 text-brand-600" size={24}/> Key Regional Hospitals
                </h2>
                <div className="space-y-4">
                    {hospitalLocations.map(h => (
                        <div key={h.name} className="bg-white rounded-xl shadow-md p-5 flex flex-col md:flex-row justify-between items-start md:items-center border-l-4 border-brand-400 gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-lg text-gray-900">{h.name}</h3>
                                    {/* Region Badge */}
                                    <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md border border-gray-200">
                                        {h.region}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{h.address}</p>
                            </div>
                            <div className="text-right flex flex-row md:flex-col items-center md:items-end gap-3 md:gap-0 w-full md:w-auto justify-between md:justify-start">
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${h.type === 'Public' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{h.type}</span>
                                <a href={`tel:${h.contact}`} className="md:mt-2 text-sm text-red-500 hover:underline flex items-center font-bold">
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