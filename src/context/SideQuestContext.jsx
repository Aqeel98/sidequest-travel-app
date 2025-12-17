import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const SideQuestContext = createContext();

export const useSideQuest = () => useContext(SideQuestContext);

export const SideQuestProvider = ({ children }) => {
  // --- STATE ---
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); 

  const [quests, setQuests] = useState([]);
  const [rewards, setRewards] = useState([]); 
  const [questProgress, setQuestProgress] = useState([]); 
  const [redemptions, setRedemptions] = useState([]);
  const [users, setUsers] = useState([]); 
  const [showAuthModal, setShowAuthModal] = useState(false);

  // --- INITIAL LOAD ---
  useEffect(() => {
    let mounted = true;

    const initializeApp = async () => {
      try {
        // 1. Check for active session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
           await fetchProfile(session.user.id, session.user.email);
        }
        
        // 2. Load all public data
        await fetchQuests();
        await fetchRewards();
        await fetchRedemptions();
        
      } catch (error) {
        console.error("Initialization Error:", error);
      } finally {
        if (mounted) setIsLoading(false); // Stop loading when done
      }
    };

    initializeApp();

    // 3. Listen for Login/Logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        // If we have a session but no user in state, fetch the profile
        if (!currentUser) await fetchProfile(session.user.id, session.user.email);
      } else {
        setCurrentUser(null);
        setQuestProgress([]);
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // --- DATA FETCHING ---
  
  // Robust Profile Fetcher (Includes "Zombie User" Fix)
  const fetchProfile = async (userId, userEmail) => {
    try {
      let { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      
      // If profile is missing in DB but Auth exists (Zombie state), fix it:
      if (!data) {
          const newProfile = { 
              id: userId, 
              email: userEmail, 
              full_name: userEmail.split('@')[0], 
              role: userEmail === 'sidequestsrilanka@gmail.com' ? 'Admin' : 'Traveler'
          };
          
          const { data: created, error: createError } = await supabase
              .from('profiles').upsert([newProfile]).select().single();
          
          if (!createError) data = created;
      }

      if (data) {
          // Force Admin role for your specific email
          if (data.email === 'sidequestsrilanka@gmail.com') data.role = 'Admin';
          
          setCurrentUser(data);
          fetchSubmissions(userId, data.role);
      }
    } catch (err) {
      console.error("Profile Load Error", err);
    }
  };

  const fetchQuests = async () => {
    const { data } = await supabase.from('quests').select('*');
    setQuests(data || []);
  };

  const fetchRewards = async () => {
    const { data } = await supabase.from('rewards').select('*');
    setRewards(data || []);
  };

  const fetchSubmissions = async (userId, role) => {
    if (role === 'Admin') {
        // Admin sees ALL submissions
        const { data } = await supabase.from('submissions').select('*');
        setQuestProgress(data || []);
        // Admin also gets the list of users for display
        const { data: allUsers } = await supabase.from('profiles').select('*');
        setUsers(allUsers || []);
    } else {
        // Travelers only see their own
        const { data } = await supabase.from('submissions').select('*').eq('traveler_id', userId);
        setQuestProgress(data || []);
    }
  };

  const fetchRedemptions = async () => {
      const { data } = await supabase.from('redemptions').select('*');
      setRedemptions(data || []);
  };

  // --- AUTH ACTIONS ---
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error; 
    setShowAuthModal(false);
  };

  const signup = async (email, password, name, role) => {
    // 1. Try Sign Up
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    if (data.user) {
        const finalRole = email === 'sidequestsrilanka@gmail.com' ? 'Admin' : role;
        const newProfile = { 
            id: data.user.id, email, full_name: name, role: finalRole 
        };

        // 2. Create Profile immediately
        await supabase.from('profiles').upsert([newProfile]);
        
        // 3. Set User Locally (Instant UI update)
        setCurrentUser(newProfile);
        setShowAuthModal(false);
        alert("Welcome, " + name + "!");
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setQuestProgress([]);
  };

  // --- QUEST ACTIONS ---
  const addQuest = async (formData, imageFile) => {
    try {
        let imageUrl = null;

        // 1. Upload Image (if provided)
        if (imageFile) {
            const fileName = `quest-images/${Date.now()}_${imageFile.name.replace(/\s/g, '')}`;
            
            const { error: uploadError } = await supabase.storage
                .from('proofs') // We re-use the proofs bucket
                .upload(fileName, imageFile);

            if (uploadError) throw uploadError;

            // 2. Get the Public URL
            const { data } = supabase.storage.from('proofs').getPublicUrl(fileName);
            imageUrl = data.publicUrl;
        }

        // 3. Create Database Entry
        const { error } = await supabase.from('quests').insert([{
            title: formData.title,
            description: formData.description,
            category: formData.category,
            xp_value: Number(formData.xp_value),
            location_address: formData.location_address,
            lat: parseFloat(formData.lat),
            lng: parseFloat(formData.lng),
            instructions: formData.instructions,
            proof_requirements: formData.proof_requirements,
            image: imageUrl, // Save the Supabase URL here
            created_by: currentUser.id,
            status: currentUser.role === 'Admin' ? 'active' : 'pending_admin'
        }]);

        if (error) throw error;

        alert("Quest created successfully!");
        fetchQuests(); // Refresh the list
        return true; // Success signal

    } catch (error) {
        console.error("Add Quest Error:", error);
        alert("Failed to add quest: " + error.message);
        return false;
    }
  };


  const updateQuest = async (id, updates) => {
      const { error } = await supabase.from('quests').update(updates).eq('id', id);
      if (!error) { 
          fetchQuests(); 
          alert("Quest Updated"); 
      }
  };
  
  const deleteQuest = async (id) => {
      const { error } = await supabase.from('quests').delete().eq('id', id);
      if (!error) fetchQuests();
  };
  
  const acceptQuest = async (questId) => {
    if (!currentUser) {
        alert("Please log in to accept a quest.");
        return false;
    }
    
    try {
        const { data, error } = await supabase.from('submissions').insert([{
            quest_id: questId, 
            traveler_id: currentUser.id, // <--- MUST be currentUser.id
            status: 'in_progress'
        }]).select();
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            setQuestProgress([...questProgress, data[0]]); 
            return true; 
        }
        return false;

    } catch (error) {
        console.error("Accept Quest Failed:", error);
        alert("Failed to accept quest. You might have already accepted it, or there's a connection error.");
        return false;
    }
};

  const submitProof = async (questId, note, file) => {
    let proofUrl = null;
    if (file) {
        const fileName = `${Date.now()}_${file.name.replace(/\s/g, '')}`;
        const { error: uploadErr } = await supabase.storage.from('proofs').upload(fileName, file);
        if (!uploadErr) {
            const { data } = supabase.storage.from('proofs').getPublicUrl(fileName);
            proofUrl = data.publicUrl;
        } else {
             alert("Error uploading image"); 
             return;
        }
    }

    const existing = questProgress.find(p => p.quest_id === questId && p.traveler_id === currentUser.id);
    
    if (existing) {
        const { data } = await supabase.from('submissions').update({
            status: 'pending', completion_note: note, proof_photo_url: proofUrl, submitted_at: new Date()
        }).eq('id', existing.id).select();
        setQuestProgress(questProgress.map(p => p.id === existing.id ? data[0] : p));
    } else {
        const { data } = await supabase.from('submissions').insert([{
            quest_id: questId, traveler_id: currentUser.id, status: 'pending', completion_note: note, proof_photo_url: proofUrl
        }]).select();
        setQuestProgress([...questProgress, data[0]]);
    }
    alert("Proof Submitted!");
  };

  // --- REWARD ACTIONS ---
  const updateReward = async (id, updates) => {
      const { error } = await supabase.from('rewards').update(updates).eq('id', id);
      if (!error) { fetchRewards(); alert("Reward Updated"); }
  };

  const deleteReward = async (id) => {
      const { error } = await supabase.from('rewards').delete().eq('id', id);
      if (!error) fetchRewards();
  };

  const redeemReward = async (reward) => {
      if (currentUser.xp < reward.xp_cost) return null;
      const code = `SQ-${Date.now().toString().slice(-6)}`;
      
      const { error } = await supabase.from('profiles').update({ xp: currentUser.xp - reward.xp_cost }).eq('id', currentUser.id);
      
      if (!error) {
          const { data } = await supabase.from('redemptions').insert([{
              traveler_id: currentUser.id, reward_id: reward.id, redemption_code: code
          }]).select();
          
          setCurrentUser({...currentUser, xp: currentUser.xp - reward.xp_cost});
          setRedemptions([...redemptions, data[0]]);
          return code;
      }
  };

  // --- ADMIN ACTIONS ---
  // --- ADMIN ACTIONS ---
  const approveSubmission = async (submissionId) => {
    // 1. Find the submission to get the Traveler ID and Quest XP
    const sub = questProgress.find(p => p.id === submissionId);
    if (!sub) return; // Exit if not found
    
    const quest = quests.find(q => q.id === sub.quest_id);
    if (!quest) return; // Exit if quest not found

    // 2. Mark submission as approved
    await supabase.from('submissions').update({ status: 'approved' }).eq('id', submissionId);
    
    // 3. Award XP to the TRAVELER (sub.traveler_id)
    const { data: traveler, error: xpError } = await supabase
        .from('profiles')
        .select('xp')
        .eq('id', sub.traveler_id) // <--- CRITICAL: Use the Traveler's ID
        .single();
    
    if (xpError) {
        console.error("XP Lookup Error:", xpError);
        alert("Error looking up Traveler XP. Contact Support.");
        return;
    }

    const newXp = (traveler.xp || 0) + quest.xp_value;
    
    // 4. Update XP in the Database
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ xp: newXp })
        .eq('id', sub.traveler_id);

    if (updateError) {
        console.error("XP Update Error:", updateError);
        alert("Error updating Traveler XP in database. Contact Support.");
        return;
    }

    alert("Verified and XP Awarded!");
    // Refresh the submission list for the Admin
    fetchSubmissions(currentUser.id, 'Admin'); 
  };

  const rejectSubmission = async (id) => {
      await supabase.from('submissions').update({ status: 'rejected' }).eq('id', id);
      fetchSubmissions(currentUser.id, 'Admin');
  };
  
  const approveNewQuest = async (id) => {
      await supabase.from('quests').update({ status: 'active' }).eq('id', id);
      fetchQuests();
  };

  // --- DEMO HELPER (SAFE TO KEEP) ---
  const switchRole = (role) => {
    if (currentUser) {
        setCurrentUser({ ...currentUser, role: role });
    } else {
        alert("Please log in first!");
    }
  };

  return (
    <SideQuestContext.Provider value={{
      currentUser, isLoading, // <--- EXPOSE LOADING STATE
      users, quests, questProgress, redemptions, rewards,
      showAuthModal, setShowAuthModal,
      login, signup, logout,
      addQuest, updateQuest, deleteQuest, approveNewQuest,
      updateReward, deleteReward,
      acceptQuest, submitProof, approveSubmission, rejectSubmission,
      redeemReward, switchRole 
    }}>
      {children}
    </SideQuestContext.Provider>
  );
};