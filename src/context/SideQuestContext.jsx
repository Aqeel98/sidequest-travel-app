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

    const loadData = async () => {
        // 1. Fetch Public Data Independently (One failure won't stop the app)
        const fetchPublic = async () => {
            const { data: qData } = await supabase.from('quests').select('*');
            if (mounted && qData) setQuests(qData);

            const { data: rData } = await supabase.from('rewards').select('*');
            if (mounted && rData) setRewards(rData);

            const { data: redData } = await supabase.from('redemptions').select('*');
            if (mounted && redData) setRedemptions(redData);
        };

        await fetchPublic();

        // 2. Check Session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted && session) {
            await fetchProfile(session.user.id, session.user.email);
        } else {
            if (mounted) setIsLoading(false); // No user, stop loading
        }
    };

    loadData();

    // 3. Listen for Auth Changes (Login/Logout/Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
            // Always refresh profile on auth change to get latest XP
            await fetchProfile(session.user.id, session.user.email);
        } else {
            setCurrentUser(null);
            setQuestProgress([]);
            if (mounted) setIsLoading(false);
        }
    });

    return () => {
        mounted = false;
        subscription.unsubscribe();
    };
  }, []);

  // --- DATA FETCHING ---
  
  const fetchProfile = async (userId, userEmail) => {
    try {
      // Fetch latest profile data (XP, Name, Role)
      let { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      
      // FIX: Handle "Zombie User" (Auth exists, but Profile missing in DB)
      if (!data) {
          const newProfile = { 
              id: userId, email: userEmail, full_name: userEmail.split('@')[0], 
              role: userEmail === 'sidequestsrilanka@gmail.com' ? 'Admin' : 'Traveler'
          };
          const { data: created, error: createError } = await supabase
              .from('profiles').upsert([newProfile]).select().single();
          if (!createError) data = created;
      }

      if (data) {
          if (data.email === 'sidequestsrilanka@gmail.com') data.role = 'Admin';
          setCurrentUser(data); // <--- This updates the XP in the UI
          await fetchSubmissions(userId, data.role);
      }
    } catch (err) {
      console.error("Profile Load Error", err);
    } finally {
      setIsLoading(false); // Ensure loading stops
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
        const { data } = await supabase.from('submissions').select('*');
        setQuestProgress(data || []);
        const { data: allUsers } = await supabase.from('profiles').select('*');
        setUsers(allUsers || []);
    } else {
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
    // onAuthStateChange will handle the rest
    setShowAuthModal(false);
  };

  const signup = async (email, password, name, role) => {
    try {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (data.user) {
            const finalRole = email === 'sidequestsrilanka@gmail.com' ? 'Admin' : role;
            const newProfile = { 
                id: data.user.id, email, full_name: name, role: finalRole 
            };
            await supabase.from('profiles').upsert([newProfile]);
            setCurrentUser(newProfile);
            setShowAuthModal(false);
            alert("Welcome, " + name + "!");
        }
    } catch (err) {
        console.error("Signup Error:", err);
        alert(err.message);
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
        if (imageFile) {
            const fileName = `quest-images/${Date.now()}_${imageFile.name.replace(/\s/g, '')}`;
            const { error: uploadError } = await supabase.storage.from('proofs').upload(fileName, imageFile);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('proofs').getPublicUrl(fileName);
            imageUrl = data.publicUrl;
        }

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
            image: imageUrl, 
            created_by: currentUser.id,
            status: currentUser.role === 'Admin' ? 'active' : 'pending_admin'
        }]);

        if (error) throw error;
        alert("Quest created successfully!");
        fetchQuests(); 
        return true; 
    } catch (error) {
        alert("Failed to add quest: " + error.message);
        return false;
    }
  };

  const updateQuest = async (id, updates) => {
    try {
        const questId = Number(id); 
        const { error } = await supabase.from('quests').update(updates).eq('id', questId); 
        if (error) throw error;
        fetchQuests(); 
        alert("Quest Updated"); 
    } catch (error) {
        alert("Update Failed: " + error.message);
    }
  };
  
  const deleteQuest = async (id) => {
    try {
        const { error } = await supabase.from('quests').delete().eq('id', id);
        if (error) throw error;
        setQuests(prevQuests => prevQuests.filter(q => q.id !== id));
        alert("Quest successfully deleted!");
    } catch (error) {
        alert("Failed to delete quest: " + error.message);
    }
  };
  
  const acceptQuest = async (questId) => {
    if (!currentUser) {
        alert("Please log in to accept a quest.");
        return false;
    }
    try {
        const { data, error } = await supabase.from('submissions').insert([{
            quest_id: questId, traveler_id: currentUser.id, status: 'in_progress'
        }]).select();
        
        if (error) throw error;
        if (data && data.length > 0) {
            setQuestProgress([...questProgress, data[0]]); 
            return true; 
        }
        return false;
    } catch (error) {
        alert("Failed to accept quest.");
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
             alert("Error uploading image"); return;
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
  const approveSubmission = async (submissionId) => {
    const sub = questProgress.find(p => p.id === submissionId);
    if (!sub) return; 
    const quest = quests.find(q => q.id === sub.quest_id);
    if (!quest) return; 

    await supabase.from('submissions').update({ status: 'approved' }).eq('id', submissionId);
    
    const { data: traveler, error: xpError } = await supabase
        .from('profiles').select('xp').eq('id', sub.traveler_id).single();
    
    if (xpError) return;

    const newXp = (traveler.xp || 0) + quest.xp_value;
    const { error: updateError } = await supabase
        .from('profiles').update({ xp: newXp }).eq('id', sub.traveler_id);

    if (updateError) return;

    // Force Admin XP update locally if approving own submission
    if (sub.traveler_id === currentUser.id) {
        setCurrentUser(prevUser => ({ ...prevUser, xp: newXp }));
    }

    alert("Verified and XP Awarded!");
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

  const switchRole = (role) => {
    if (currentUser) setCurrentUser({ ...currentUser, role: role });
    else alert("Please log in first!");
  };

  return (
    <SideQuestContext.Provider value={{
      currentUser, isLoading, 
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