import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
// We keep this import just to prevent errors if you haven't deleted the file yet, 
// but the app now uses the Database for everything.
import { initialData } from '../data/mockData'; 

const SideQuestContext = createContext();

export const useSideQuest = () => useContext(SideQuestContext);

export const SideQuestProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [quests, setQuests] = useState([]);
  const [rewards, setRewards] = useState([]); 
  const [questProgress, setQuestProgress] = useState([]); 
  const [redemptions, setRedemptions] = useState([]);
  const [users, setUsers] = useState([]); 
  const [showAuthModal, setShowAuthModal] = useState(false);

  // --- INITIAL LOAD ---
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) await fetchProfile(session.user.id);
      
      fetchQuests();
      fetchRewards();
      fetchRedemptions();
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        await fetchProfile(session.user.id);
      } else {
        setCurrentUser(null);
        setQuestProgress([]);
        setRedemptions([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- DATA FETCHING ---
  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
        if (data.email === 'sidequestsrilanka@gmail.com') {
            data.role = 'Admin';
        }
        setCurrentUser(data);
        fetchSubmissions(userId, data.role);
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else setShowAuthModal(false);
  };

  const signup = async (email, password, name, role) => {
    try {
        // 1. Try to Sign Up
        const { data, error } = await supabase.auth.signUp({ email, password });
        
        if (error) throw error;

        // If email confirmation is ON, session might be null, but user exists.
        // We proceed to create the profile anyway so they can log in later.
        if (data.user) {
            
            // 2. Prepare Profile Data
            const finalRole = email === 'sidequestsrilanka@gmail.com' ? 'Admin' : role;
            const newProfile = { 
                id: data.user.id, 
                email, 
                full_name: name, 
                role: finalRole 
            };

            // 3. Save Profile (Upsert = Fixes the "Hang" if profile is missing)
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert([newProfile], { onConflict: 'id' }); 
            
            if (profileError) throw profileError;

            // 4. Update UI
            setCurrentUser(newProfile);
            alert("Account created! Welcome, " + name);
            setShowAuthModal(false);
        }
    } catch (err) {
        console.error("Signup Error:", err);
        // If the error is "User already registered", we try to just log them in automatically
        if (err.message.includes("registered")) {
             alert("You are already registered! Please switch to 'Log In'.");
        } else {
             alert(err.message);
        }
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  // --- QUEST ACTIONS ---
  const addQuest = async (form) => {
    const { error } = await supabase.from('quests').insert([{
        ...form,
        created_by: currentUser.id,
        status: currentUser.role === 'Admin' ? 'active' : 'pending_admin'
    }]);
    if (!error) {
        alert("Quest Created!");
        fetchQuests();
    }
  };

  const updateQuest = async (id, updates) => {
      const { error } = await supabase.from('quests').update(updates).eq('id', id);
      if (!error) { fetchQuests(); alert("Quest Updated"); }
  };
  
  const deleteQuest = async (id) => {
      const { error } = await supabase.from('quests').delete().eq('id', id);
      if (!error) fetchQuests();
  };
  
  const acceptQuest = async (questId) => {
      const { data, error } = await supabase.from('submissions').insert([{
          quest_id: questId,
          traveler_id: currentUser.id,
          status: 'in_progress'
      }]).select();
      
      if (!error) {
          setQuestProgress([...questProgress, data[0]]);
          return true;
      }
      return false;
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
             console.error("Upload error:", uploadErr);
             alert("Error uploading image");
             return;
        }
    }

    const existing = questProgress.find(p => p.quest_id === questId && p.traveler_id === currentUser.id);
    
    if (existing) {
        const { data } = await supabase.from('submissions').update({
            status: 'pending',
            completion_note: note,
            proof_photo_url: proofUrl,
            submitted_at: new Date()
        }).eq('id', existing.id).select();
        setQuestProgress(questProgress.map(p => p.id === existing.id ? data[0] : p));
    } else {
        const { data } = await supabase.from('submissions').insert([{
            quest_id: questId,
            traveler_id: currentUser.id,
            status: 'pending',
            completion_note: note,
            proof_photo_url: proofUrl
        }]).select();
        setQuestProgress([...questProgress, data[0]]);
    }
    alert("Proof Submitted! Waiting for Admin verification.");
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
              traveler_id: currentUser.id,
              reward_id: reward.id,
              redemption_code: code
          }]).select();
          
          setCurrentUser({...currentUser, xp: currentUser.xp - reward.xp_cost});
          setRedemptions([...redemptions, data[0]]);
          return code;
      }
  };

  // --- ADMIN ACTIONS ---
  const approveSubmission = async (submissionId) => {
    const sub = questProgress.find(p => p.id === submissionId);
    const quest = quests.find(q => q.id === sub.quest_id);
    
    await supabase.from('submissions').update({ status: 'approved' }).eq('id', submissionId);
    
    const { data: traveler } = await supabase.from('profiles').select('xp').eq('id', sub.traveler_id).single();
    await supabase.from('profiles').update({ xp: (traveler.xp || 0) + quest.xp_value }).eq('id', sub.traveler_id);

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

  // --- DEMO HELPER (Restored for your testing) ---
  const switchRole = (role) => {
    if (currentUser) {
      // This temporarily overrides the role locally (doesn't change DB)
      // Good for quick UI testing
      setCurrentUser({ ...currentUser, role: role });
    } else {
      alert("Please log in first to switch roles!");
    }
  };

  return (
    <SideQuestContext.Provider value={{
      currentUser, users, quests, questProgress, redemptions, rewards,
      showAuthModal, setShowAuthModal,
      login, signup, logout,
      addQuest, updateQuest, deleteQuest, approveNewQuest,
      updateReward, deleteReward,
      acceptQuest, submitProof, approveSubmission, rejectSubmission,
      redeemReward,
      switchRole 
    }}>
      {children}
    </SideQuestContext.Provider>
  );
};