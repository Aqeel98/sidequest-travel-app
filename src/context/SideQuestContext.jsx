import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import imageCompression from 'browser-image-compression';

const SideQuestContext = createContext();

export const useSideQuest = () => useContext(SideQuestContext);

export const SideQuestProvider = ({ children }) => {
  // --- 1. FULL STATE ARCHITECTURE ---
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); 

  const [quests, setQuests] = useState([]);
  const [rewards, setRewards] = useState([]); 
  const [questProgress, setQuestProgress] = useState([]); 
  const [redemptions, setRedemptions] = useState([]);
  const [users, setUsers] = useState([]); 
  const [showAuthModal, setShowAuthModal] = useState(false);

  // MASTER SECURITY CONSTANT
  const ADMIN_EMAIL = 'sidequestsrilanka@gmail.com';

  // --- 2. HARDENED INITIALIZATION (The "Refresh & Persistence" Fix) ---
  useEffect(() => {
    let mounted = true;

    const initializeApp = async () => {
      try {
        console.log("SQ-System: System Boot Sequence Started...");
        setIsLoading(true);

        // A. Parallel Fetch of Public Ecosystem Data
        const [questsData, rewardsData] = await Promise.all([
            supabase.from('quests').select('*'),
            supabase.from('rewards').select('*'),
        ]);

        if (mounted) {
            setQuests(questsData.data || []);
            setRewards(rewardsData.data || []);
            console.log("SQ-System: Quests & Rewards synced.");
        }

        // B. THE ANCHOR: Manually recover auth session from storage
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (mounted && session) {
           console.log("SQ-System: Valid session found for", session.user.email);
           // We await this so the user doesn't see a "Login" button before the profile loads
           await fetchProfile(session.user.id, session.user.email);
        } else {
           console.log("SQ-System: No existing session found. App starting in Guest mode.");
        }
        
      } catch (error) {
        console.error("SQ-System: Critical Boot Error ->", error);
      } finally {
        // PERMANENT FIX: Loading screen only disappears once Auth check is 100% done
        if (mounted) {
            console.log("SQ-System: System ready. Opening Gateway.");
            setIsLoading(false);
        }
      }
    };

    initializeApp();

    // --- 3. AUTH STATE LISTENER (Handles Real-time Handshake) ---
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        console.log("SQ-System: Auth Event Fired ->", event);
        
        if (session) {
          // Sync profile if user logs in or refreshes
          if (!currentUser) {
            await fetchProfile(session.user.id, session.user.email);
          }
          // Closes the "Processing..." Modal the second the DB confirms the user
          setShowAuthModal(false); 
        } else if (event === 'SIGNED_OUT') {
          console.log("SQ-System: User signed out. Cleaning state.");
          setCurrentUser(null);
          setQuestProgress([]);
          setRedemptions([]);
          setUsers([]);
          setIsLoading(false);
        }
      }
    });

    // Safety Timer (Protection for users on slow Sri Lankan mobile networks)
    const safetyTimer = setTimeout(() => {
      if (mounted) {
        console.warn("SQ-System: Network Timeout. Forcing Loader Close.");
        setIsLoading(false);
      }
    }, 9000); 

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []); 

  // --- 4. REALTIME XP SUBSCRIPTION ---
  const subscribeToProfileChanges = (userId) => {
      const channel = supabase
        .channel(`profile-updates-${userId}`)
        .on('postgres_changes', 
            { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, 
            (payload) => {
                console.log("SQ-System: Realtime XP Update Received.");
                setCurrentUser(prev => ({ ...prev, ...payload.new }));
            }
        )
        .subscribe();
      
      return () => supabase.removeChannel(channel);
  };

  // --- 5. DATA SYNC FUNCTIONS ---
  
  const fetchProfile = async (userId, userEmail) => {
    try {
      // maybeSingle() prevents app crashes if the user record is missing
      let { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      
      if (error) {
          console.error("Profile Fetch Error:", error.message);
          return;
      }

      // ZOMBIE USER FIX: Auto-repair profiles that exist in Auth but not in Database
      if (!data) {
          console.log("SQ-System: Zombie profile detected. Repairing database record...");
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
          // Hardcoded Admin Security Logic
          if (data.email === ADMIN_EMAIL) data.role = 'Admin';
          
          setCurrentUser(data);
          subscribeToProfileChanges(userId);
          
          // Load user-specific data in parallel
          await Promise.all([
             fetchSubmissions(userId, data.role),
             fetchRedemptions(userId)
          ]);
      }
    } catch (err) {
      console.error("SQ-System: Critical Profile Load Error", err);
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

  // --- 6. AUTHENTICATION ACTIONS ---

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error; 
    // Modal closure handled by onAuthStateChange listener
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

  // --- 7. QUEST ACTIONS (TRAVELER & PARTNER) ---

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
        alert("Quest created and sent for review!");
        fetchQuests(); 
        return true; 
    } catch (error) {
        alert("Failed to add quest: " + error.message);
        return false;
    }
  };

  const updateQuest = async (id, updates) => {
    try {
        const { error } = await supabase.from('quests').update(updates).eq('id', Number(id)); 
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

  // SUBMIT PROOF (Optimized with Compression)
  const submitProof = async (questId, note, file) => {
    try {
        let proofUrl = null;
        if (file) {
            // COMPRESSION: Ensures fast uploads on Sri Lankan 4G
            const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1280, useWebWorker: true };
            const compressedFile = await imageCompression(file, options);
            
            const fileName = `proofs/${Date.now()}_${file.name.replace(/\s/g, '')}`;
            const { error: uploadErr } = await supabase.storage.from('proofs').upload(fileName, compressedFile);
            
            if (uploadErr) { 
                alert("Image upload failed: " + uploadErr.message); 
                return false; 
            }
            const { data } = supabase.storage.from('proofs').getPublicUrl(fileName);
            proofUrl = data.publicUrl;
        }

        const existing = questProgress.find(p => p.quest_id === questId && p.traveler_id === currentUser.id);
        const payload = { status: 'pending', completion_note: note, proof_photo_url: proofUrl, submitted_at: new Date() };
        
        if (existing) {
            const { data, error: updateErr } = await supabase.from('submissions').update(payload).eq('id', existing.id).select();
            if (updateErr) throw updateErr;
            setQuestProgress(questProgress.map(p => p.id === existing.id ? data[0] : p));
        } else {
            const { data, error: insertErr } = await supabase.from('submissions').insert([{
                ...payload, quest_id: questId, traveler_id: currentUser.id
            }]).select();
            if (insertErr) throw insertErr;
            setQuestProgress([...questProgress, data[0]]);
        }
        alert("Proof Submitted Successfully!");
        return true;
    } catch (err) {
        alert("Submission Error: " + err.message);
        return false;
    }
  };

  // --- 8. REWARD ACTIONS ---

  const addReward = async (formData, imageFile) => {
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
        alert("Reward created successfully and sent for review!");
        fetchRewards();
        return true;
    } catch (error) {
        alert("Failed to add reward: " + error.message);
        return false;
    }
  };

  const updateReward = async (id, updates) => {
      try {
        const { error } = await supabase.from('rewards').update(updates).eq('id', Number(id));
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
      
      const { error: xpError } = await supabase.from('profiles').update({ xp: currentUser.xp - reward.xp_cost }).eq('id', currentUser.id);
      
      if (!xpError) {
          const { data, error: redError } = await supabase.from('redemptions').insert([{
              traveler_id: currentUser.id, reward_id: reward.id, redemption_code: code
          }]).select();
          
          if (redError) throw redError;

          setCurrentUser({...currentUser, xp: currentUser.xp - reward.xp_cost});
          setRedemptions([...redemptions, data[0]]);
          return code;
      }
      return null;
  };

  // --- 9. ADMIN MODERATION ACTIONS ---

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
      alert("Submission Rejected.");
      fetchSubmissions(currentUser.id, 'Admin');
  };
  
  const approveNewQuest = async (id) => {
      await supabase.from('quests').update({ status: 'active' }).eq('id', id);
      alert("Quest Approved and Active.");
      fetchQuests();
  };

  const approveNewReward = async (id) => {
      await supabase.from('rewards').update({ status: 'active' }).eq('id', id);
      alert("Reward Approved and Active.");
      fetchRewards();
  };

  // --- 10. ROLE SECURITY ACTION ---
  const switchRole = (role) => {
    if (!currentUser) {
        alert("Please log in first!");
        return;
    }

    // ACCURACY LOCK: Only the hardcoded master admin email can perform this action
    if (currentUser.email !== ADMIN_EMAIL) {
        console.warn("SQ-System: Role switch attempted by unauthorized user.");
        return; 
    }

    console.log(`SQ-System: Master Admin switching view to ${role}`);
    
    // Update local context role
    setCurrentUser({ ...currentUser, role: role });
    
    // Instantly refresh data to match the new role view
    fetchSubmissions(currentUser.id, role);
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