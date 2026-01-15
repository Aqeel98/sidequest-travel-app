import React, { useState, useMemo } from 'react';
import { HeartPulse, Phone, MapPin, Shield, Siren, AlertCircle, Navigation, Search, Crosshair, Loader2 } from 'lucide-react';

// --- DATA: ALL 25 DISTRICTS + YOUR REGIONAL NOTES ---
const HOSPITAL_DATA = [
    // SOUTHERN PROVINCE (Expanded + Your Notes)
    { name: "Karapitiya Teaching Hospital", district: "Galle", type: "Public", contact: "+94 91 223 2176", lat: 6.0638, lng: 80.2222, note: "Largest tertiary care center in the South." },
    { name: "Ruhunu Hospital (Pvt)", district: "Galle", type: "Private", contact: "+94 91 223 1281", lat: 6.0455, lng: 80.2166, note: "Reliable private option in Galle." },
    { name: "Matara District General Hospital", district: "Matara", type: "Public", contact: "+94 41 222 2261", lat: 5.9520, lng: 80.5422, note: "Main public hospital in Matara center." },
    { name: "Medi-Help Hospital (Pvt)", district: "Matara", type: "Private", contact: "+94 41 223 1411", lat: 5.9490, lng: 80.5460, note: "Private medical care hub in Matara." },
    { name: "Tangalle Base Hospital", district: "Hambantota", type: "Public", contact: "+94 47 224 0261", lat: 6.0245, lng: 80.7950, note: "Primary care for Tangalle & Deep South beaches." },
    { name: "Hambantota General Hospital", district: "Hambantota", type: "Public", contact: "+94 47 222 0261", lat: 6.1345, lng: 81.1185, note: "Major facility near Mattala/Yala." },

    // WESTERN PROVINCE
    { name: "Colombo National Hospital", district: "Colombo", type: "Public", contact: "+94 11 269 1111", lat: 6.9192, lng: 79.8681, note: "Regarded as the best public hospital for trauma." },
    { name: "Lanka Hospitals (Pvt)", district: "Colombo", type: "Private", contact: "+94 11 543 0000", lat: 6.8920, lng: 79.8770, note: "Reliable private option in the Capital." },
    { name: "Gampaha General Hospital", district: "Gampaha", type: "Public", contact: "+94 33 222 2261", lat: 7.0910, lng: 79.9960, note: "Main hospital for Gampaha district." },
    { name: "Kalutara General Hospital", district: "Kalutara", type: "Public", contact: "+94 34 222 2261", lat: 6.5860, lng: 79.9570, note: "Serving the Western coast belt." },

    // CENTRAL PROVINCE
    { name: "Kandy National Hospital", district: "Kandy", type: "Public", contact: "+94 81 222 2261", lat: 7.2910, lng: 80.6320, note: "Main hub for Pekoe Trail & Knuckles region." },
    { name: "Matale General Hospital", district: "Matale", type: "Public", contact: "+94 66 222 2261", lat: 7.4720, lng: 80.6230, note: "Serving Dambulla & Sigiriya area." },
    { name: "Nuwara Eliya General Hospital", district: "Nuwara Eliya", type: "Public", contact: "+94 52 222 2261", lat: 6.9670, lng: 80.7760, note: "Central hub for Hill Country/Tea Estates." },

    // UVA PROVINCE
    { name: "Badulla General Hospital", district: "Badulla", type: "Public", contact: "+94 55 222 2261", lat: 6.9880, lng: 81.0560, note: "Closest major hospital for Ella & Diyaluma." },
    { name: "Monaragala General Hospital", district: "Monaragala", type: "Public", contact: "+94 55 227 6161", lat: 6.8710, lng: 81.3520, note: "Main care for Arugam Bay travelers." },

    // NORTHERN PROVINCE
    { name: "Jaffna Teaching Hospital", district: "Jaffna", type: "Public", contact: "+94 21 222 2261", lat: 9.6640, lng: 80.0190, note: "Main hospital for Delft & Point Pedro." },
    { name: "Vavuniya General Hospital", district: "Vavuniya", type: "Public", contact: "+94 24 222 2261", lat: 8.7510, lng: 80.4980, note: "Hub between North and Cultural Triangle." },
    { name: "Mannar District Hospital", district: "Mannar", type: "Public", contact: "+94 23 222 2261", lat: 8.9830, lng: 79.9100, note: "Primary care for the Mannar basin." },
    { name: "Kilinochchi General Hospital", district: "Kilinochchi", type: "Public", contact: "+94 21 228 5327", lat: 9.3830, lng: 80.4000, note: "Main facility in the Vanni region." },
    { name: "Mullaitivu General Hospital", district: "Mullaitivu", type: "Public", contact: "+94 21 229 0261", lat: 9.2710, lng: 80.7830, note: "Coastal hospital for the North-East." },

    // EASTERN PROVINCE
    { name: "Trincomalee General Hospital", district: "Trincomalee", type: "Public", contact: "+94 26 222 2261", lat: 8.5720, lng: 81.2330, note: "Primary care for Pigeon Island/Nilaveli." },
    { name: "Batticaloa Teaching Hospital", district: "Batticaloa", type: "Public", contact: "+94 65 222 2261", lat: 7.7170, lng: 81.6970, note: "Main hospital for Pasikudah travelers." },
    { name: "Ampara General Hospital", district: "Ampara", type: "Public", contact: "+94 63 222 2261", lat: 7.2910, lng: 81.6720, note: "Regional care for the East interior." },

    // NORTH CENTRAL PROVINCE
    { name: "Anuradhapura Teaching Hospital", district: "Anuradhapura", type: "Public", contact: "+94 25 222 2261", lat: 8.3440, lng: 80.4020, note: "Hub for Wilpattu & Ritigala." },
    { name: "Polonnaruwa General Hospital", district: "Polonnaruwa", type: "Public", contact: "+94 27 222 2261", lat: 7.9400, lng: 81.0020, note: "Primary care for the Ancient City & Minneriya." },

    // NORTH WESTERN PROVINCE
    { name: "Kurunegala Teaching Hospital", district: "Kurunegala", type: "Public", contact: "+94 37 222 2261", lat: 7.4870, lng: 80.3620, note: "Main hub for the North Western province." },
    { name: "Puttalam District Hospital", district: "Puttalam", type: "Public", contact: "+94 32 226 5261", lat: 8.0330, lng: 79.8270, note: "Closest care for Kalpitiya/Kite Surfing." },

    // SABARAGAMUWA PROVINCE
    { name: "Ratnapura Teaching Hospital", district: "Ratnapura", type: "Public", contact: "+94 45 222 2261", lat: 6.6820, lng: 80.3990, note: "Main hub for Sinharaja & Gems region." },
    { name: "Kegalle General Hospital", district: "Kegalle", type: "Public", contact: "+94 35 222 2261", lat: 7.2510, lng: 80.3450, note: "Care for the route between Colombo & Kandy." }
];

const Emergency = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [userLoc, setUserLoc] = useState(null);
    const [isLocating, setIsLocating] = useState(false);

    // National Emergency Contacts (Unified from your snippet)
    const emergencyContacts = [
        { name: "Police", number: "119", icon: <Shield size={20} />, color: 'text-red-600' },
        { name: "Ambulance", number: "1990", icon: <Siren size={20} />, color: 'text-red-600' }, 
        { name: "Ambulance/Fire", number: "110", icon: <Siren size={20} />, color: 'text-red-600' }, 
        { name: "Tourist Police", number: "1912", icon: <MapPin size={20} />, color: 'text-blue-600', full: "+94112421052" },
    ];

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
        return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
    };

    const findClosest = () => {
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setIsLocating(false);
            },
            () => {
                alert("Please enable GPS to find nearest hospital.");
                setIsLocating(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const displayHospitals = useMemo(() => {
        let filtered = HOSPITAL_DATA.filter(h => 
            h.district.toLowerCase().includes(searchQuery.toLowerCase()) || 
            h.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (userLoc) {
            return filtered.sort((a, b) => {
                const dA = calculateDistance(userLoc.lat, userLoc.lng, a.lat, a.lng);
                const dB = calculateDistance(userLoc.lat, userLoc.lng, b.lat, b.lng);
                return dA - dB;
            });
        }
        return filtered;
    }, [searchQuery, userLoc]);

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 pb-32 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-black mb-2 text-gray-900 flex items-center tracking-tight">
                <HeartPulse className="text-red-600 mr-3" size={32} /> Safety & Emergency
            </h1>
            <p className="text-gray-500 mb-8 font-medium italic">Crucial contacts for all 25 districts across the island.</p>

            {/* --- TOP ACTIONS: 1990 & GPS --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <a href="tel:1990" className="bg-red-600 p-6 rounded-3xl text-white flex items-center justify-between shadow-xl shadow-red-200 active:scale-95 transition-all">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Primary Medical Help</p>
                        <h2 className="text-2xl font-black">Call Suwa Seriya 1990</h2>
                    </div>
                    <Siren size={32} className="opacity-50" />
                </a>

                <button onClick={findClosest} disabled={isLocating} className="bg-brand-600 p-6 rounded-3xl text-white flex items-center justify-between shadow-xl shadow-brand-200 active:scale-95 transition-all">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Location Based Help</p>
                        <h2 className="text-2xl font-black">{isLocating ? 'Locating...' : 'Find Nearest Hospital'}</h2>
                    </div>
                    {isLocating ? <Loader2 className="animate-spin" size={32}/> : <Crosshair size={32} className="opacity-50" />}
                </button>
            </div>

            {/* --- QUICK CONTACT GRID --- */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {emergencyContacts.map(c => (
                    <a key={c.name} href={`tel:${c.full || c.number}`} className="bg-white p-4 rounded-2xl shadow-sm border-b-4 border-red-500 flex flex-col items-center justify-center text-center active:scale-95 transition-all">
                        <div className={c.color}>{c.icon}</div>
                        <span className="text-[10px] font-black text-gray-400 mt-2 uppercase">{c.name}</span>
                        <span className="text-lg font-black text-gray-900">{c.number}</span>
                    </a>
                ))}
            </div>

            {/* --- SEARCH --- */}
            <div className="mb-6 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                    type="text"
                    placeholder="Search by District or City (e.g. Galle, Ella)..."
                    className="w-full pl-12 pr-4 py-4 bg-white border-0 rounded-2xl shadow-sm focus:ring-4 focus:ring-brand-500/10 outline-none font-medium"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* --- HOSPITAL LIST --- */}
            <div className="space-y-4">
                {displayHospitals.map(h => {
                    const distance = userLoc ? calculateDistance(userLoc.lat, userLoc.lng, h.lat, h.lng).toFixed(1) : null;
                    return (
                        <div key={h.name} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-lg text-gray-900">{h.name}</h3>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${h.type === 'Public' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                            {h.type}
                                        </span>
                                    </div>
                                    <p className="text-xs font-black text-brand-600 uppercase tracking-widest mt-1">
                                        {h.district} District {distance && `• ${distance} km away`}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-2 italic font-medium">"{h.note}"</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <a href={`tel:${h.contact}`} className="flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 rounded-2xl font-black text-sm active:scale-95 transition-all">
                                    <Phone size={16} /> Call
                                </a>
                                <a 
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name + " " + h.district + " Sri Lanka")}`} 
                                     target="_blank" 
                                     rel="noreferrer" 
                                     className="flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-2xl font-black text-sm active:scale-95 transition-all"
                                        >
                                 <Navigation size={16} /> Directions
                                </a>
                               
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* --- DISCLAIMER --- */}
            <div className="mt-12 p-6 bg-yellow-50 rounded-3xl border border-yellow-100">
                <div className="flex gap-3">
                    <AlertCircle className="text-yellow-600 flex-shrink-0" />
                    <p className="text-xs text-yellow-800 font-bold leading-relaxed">
                        Safety Tip: Always have your travel insurance details and passport copy with you. 
                        In an extreme emergency, contact your embassy first. Suwa Seriya (1990) is a free island-wide service.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Emergency;