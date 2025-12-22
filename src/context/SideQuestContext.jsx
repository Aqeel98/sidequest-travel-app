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

  const ADMIN_EMAIL = 'sidequestsrilanka@gmail.com';

  // --- INITIAL LOAD (Runs Once on App Start) ---
  useEffect(() => {
    let mounted = true;

    const initializeApp = async () => {
      try {
        // 1. Fetch Public Data (Parallel for speed)
        const [questsData, rewardsData] = await Promise.all([
            supabase.from('quests').select('*'),
            supabase.from('rewards').select('*'),
        ]);

        if (mounted) {
            setQuests(questsData.data || []);
            setRewards(rewardsData.data || []);
        }

        // 2. Check for existing Session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted && session) {
           // Wait for profile to load so state is ready before loader closes
           await fetchProfile(session.user.id, session.user.email);
        }
        
      } catch (error) {
        console.error("Initialization Error:", error);
      } finally {
        // PERMANENT FIX: This ensures the loading screen closes regardless of errors
        if (mounted) setIsLoading(false);
      }
    };

    initializeApp();

    // --- AUTH LISTENER ---
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        if (session) {
          // If user logs in or session is restored
          await fetchProfile(session.user.id, session.user.email);
          setShowAuthModal(false); 
        } else if (event === 'SIGNED_OUT') {
          // Clear everything on logout
          setCurrentUser(null);
          setQuestProgress([]);
          setRedemptions([]);
          setUsers([]);
          setIsLoading(false);
        }
      }
    });

    // Safety timer: Fallback to close loader if database is extremely slow
    const safetyTimer = setTimeout(() => {
      if (mounted) setIsLoading(false);
    }, 8000); 

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []); // EMPTY ARRAY Fixes the "Loading Hang" infinite loop

  // --- REALTIME SUBSCRIPTION (XP UPDATES) ---
  const subscribeToProfileChanges = (userId) => {
      const channel = supabase
        .channel(`profile-updates-${userId}`)
        .on('postgres_changes', 
            { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, 
            (payload) => {
                setCurrentUser(prev => ({ ...prev, ...payload.new }));
            }
        )
        .subscribe();
      
      return () => supabase.removeChannel(channel);
  };

  // --- DATA FETCHING ---
  
  const fetchProfile = async (userId, userEmail) => {
    try {
      // 1. Get the profile safely
      let { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      
      if (error) throw error;

      // 2. Zombie User Fix (Auto-create missing profile row)
      if (!data) {
          const newProfile = { 
              id: userId, email: userEmail, full_name: userEmail.split('@')[0], 
              role: userEmail === ADMIN_EMAIL ? 'Admin' : 'Traveler',
              xp: 0
          };
          const { data: created, error: createError } = await supabase
              .from('profiles').upsert([newProfile]).select().single();
          
          if (!createError) data = created;
      }

      if (data) {
          // Role enforcement
          if (data.email === ADMIN_EMAIL) data.role = 'Admin';
          
          setCurrentUser(data);
          subscribeToProfileChanges(userId);
          
          // Fetch user-specific data
          await Promise.all([
             fetchSubmissions(userId, data.role),
             fetchRedemptions(userId)
          ]);
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

  const fetchRedemptions = async (userId) => {
    const { data } = await supabase.from('redemptions').select('*').eq('traveler_id', userId);
    setRedemptions(data || []);
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

  // --- AUTH ACTIONS ---
  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error; 
  };

  const signup = async (email, password, name, role) => {
    try {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (data.user) {
            const finalRole = email === ADMIN_EMAIL ? 'Admin' : role;
            const newProfile = { 
                id: data.user.id, email, full_name: name, role: finalRole, xp: 0
            };
            await supabase.from('profiles').upsert([newProfile]);
            alert("Welcome to SideQuest, " + name + "!");
        }
    } catch (err) {
        console.error("Signup Error:", err);
        throw err;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
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
    try {
        let proofUrl = null;
        if (file) {
            const fileName = `${Date.now()}_${file.name.replace(/\s/g, '')}`;
            const { error: uploadErr } = await supabase.storage.from('proofs').upload(fileName, file);
            
            if (uploadErr) { 
                alert("Image upload failed: " + uploadErr.message); 
                return; 
            }

            const { data } = supabase.storage.from('proofs').getPublicUrl(fileName);
            proofUrl = data.publicUrl;
        }

        const existing = questProgress.find(p => p.quest_id === questId && p.traveler_id === currentUser.id);
        
        if (existing) {
            const { data, error: updateErr } = await supabase.from('submissions').update({
                status: 'pending', completion_note: note, proof_photo_url: proofUrl, submitted_at: new Date()
            }).eq('id', existing.id).select();
            
            if (updateErr) throw updateErr;
            setQuestProgress(questProgress.map(p => p.id === existing.id ? data[0] : p));
        } else {
            const { data, error: insertErr } = await supabase.from('submissions').insert([{
                quest_id: questId, traveler_id: currentUser.id, status: 'pending', completion_note: note, proof_photo_url: proofUrl
            }]).select();
            
            if (insertErr) throw insertErr;
            setQuestProgress([...questProgress, data[0]]);
        }
        alert("Proof Submitted Successfully!");
    } catch (err) {
        alert("Submission Error: " + err.message);
    }
  };

  // --- REWARD ACTIONS ---
  const addReward = async (formData, imageFile) => {
    if (!currentUser) {
        alert("Session expired. Please log in again.");
        return false;
    }

    try {
        let imageUrl = null;
        if (imageFile) {
            const fileName = `reward-images/${Date.now()}_${imageFile.name.replace(/\s/g, '')}`;
            const { error: uploadError } = await supabase.storage.from('proofs').upload(fileName, imageFile);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('proofs').getPublicUrl(fileName);
            imageUrl = data.publicUrl;
        }

        const { error } = await supabase.from('rewards').insert([{
            title: formData.title,
            description: formData.description,
            xp_cost: Number(formData.xp_cost),
            image: imageUrl,
            created_by: currentUser.id,
            status: currentUser.role === 'Admin' ? 'active' : 'pending_admin'
        }]);

        if (error) throw error;
        alert("Reward created successfully!");
        fetchRewards();
        return true;
    } catch (error) {
        alert("Failed to add reward: " + error.message);
        return false;
    }
  };

  const updateReward = async (id, updates) => {
      try {
        const rewardId = Number(id); 
        const { error } = await supabase.from('rewards').update(updates).eq('id', rewardId);
        if (error) throw error;
        fetchRewards(); 
        alert("Reward Updated"); 
      } catch (error) {
        alert("Update Failed: " + error.message);
      }
  };

  const deleteReward = async (id) => {
      try {
        const { error } = await supabase.from('rewards').delete().eq('id', id);
        if (error) throw error;
        fetchRewards();
        alert("Reward Deleted");
      } catch (error) {
        alert("Delete Failed: " + error.message);
      }
  };

  const redeemReward = async (reward) => {
      if (currentUser.xp < reward.xp_cost) {
          alert("Not enough XP!");
          return null;
      }
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

    // 1. Approve
    await supabase.from('submissions').update({ status: 'approved' }).eq('id', submissionId);
    
    // 2. Get User
    const { data: traveler } = await supabase.from('profiles').select('xp').eq('id', sub.traveler_id).single();
    if (!traveler) return;

    // 3. Update XP
    const newXp = (traveler.xp || 0) + quest.xp_value;
    await supabase.from('profiles').update({ xp: newXp }).eq('id', sub.traveler_id);

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

  const approveNewReward = async (id) => {
      await supabase.from('rewards').update({ status: 'active' }).eq('id', id);
      fetchRewards();
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
      addReward, updateReward, deleteReward, approveNewReward, 
      acceptQuest, submitProof, approveSubmission, rejectSubmission,
      redeemReward, switchRole 
    }}>
      {children}
    </SideQuestContext.Provider>
  );
};