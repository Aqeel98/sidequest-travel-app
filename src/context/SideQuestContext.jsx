import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialData } from '../data/mockData';

const SideQuestContext = createContext();

export const useSideQuest = () => useContext(SideQuestContext);

export const SideQuestProvider = ({ children }) => {
  // --- STATE ---
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState(initialData.users);
  const [quests, setQuests] = useState(initialData.quests); 
  // NOTE: In a perfect world, 'rewards' would also be a state, but for this demo, 
  // we'll rely on initialData.rewards as the source of truth, updating it in place for simplicity.
  const [questProgress, setQuestProgress] = useState(initialData.questProgress);
  const [redemptions, setRedemptions] = useState(initialData.redemptions);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // --- INITIAL LOAD (Load all persistent data) ---
  useEffect(() => {
    const savedUser = localStorage.getItem('sidequest_user');
    const savedUsers = localStorage.getItem('sidequest_users'); 
    const savedQuests = localStorage.getItem('sidequest_quests'); 
    const savedProgress = localStorage.getItem('sidequest_progress');
    const savedRedemptions = localStorage.getItem('sidequest_redemptions');
    
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
    if (savedUsers) setUsers(JSON.parse(savedUsers)); 
    if (savedQuests) setQuests(JSON.parse(savedQuests)); 
    if (savedProgress) setQuestProgress(JSON.parse(savedProgress));
    if (savedRedemptions) setRedemptions(JSON.parse(savedRedemptions));

  }, []);

  // --- PERSISTENCE (Save data whenever state changes) ---
  useEffect(() => {
    if (currentUser) localStorage.setItem('sidequest_user', JSON.stringify(currentUser));
    else localStorage.removeItem('sidequest_user');
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('sidequest_users', JSON.stringify(users)); 
  }, [users]);

  useEffect(() => {
    localStorage.setItem('sidequest_quests', JSON.stringify(quests)); 
  }, [quests]);

  useEffect(() => {
    localStorage.setItem('sidequest_progress', JSON.stringify(questProgress));
  }, [questProgress]);

  useEffect(() => {
    localStorage.setItem('sidequest_redemptions', JSON.stringify(redemptions));
  }, [redemptions]);

  // --- AUTH ACTIONS ---

  const login = (email, name) => {
    let existingUser = users.find(u => u.email === email);
    
    if (existingUser) {
      setCurrentUser(existingUser);
    } else {
      const newUser = { 
        id: Date.now().toString(), 
        email, 
        name: name || email.split('@')[0], 
        role: 'Traveler', 
        xp: 0 
      };
      setUsers([...users, newUser]);
      setCurrentUser(newUser);
    }
    setShowAuthModal(false);
  };

  const logout = () => setCurrentUser(null);
  
  const switchRole = (role) => {
    if (!currentUser) return;
    const updated = { ...currentUser, role };
    setCurrentUser(updated);
    setUsers(users.map(u => u.id === currentUser.id ? updated : u));
  };


  // --- QUEST MANAGEMENT (Partner/Admin) ---
  
  // Partner adds a quest (starts as pending_admin)
  const addQuest = (newQuestData) => {
    const newQuest = {
      id: Date.now().toString(),
      ...newQuestData,
      status: 'pending_admin', 
      xp_value: Number(newQuestData.xp_value) || 50,
      lat: Number(newQuestData.lat),
      lng: Number(newQuestData.lng),
      created_by_id: currentUser.id,
      created_date: new Date().toISOString()
    };
    setQuests(prev => [...prev, newQuest]);
    return newQuest;
  };

  // Admin approves a new quest to become active
  const approveNewQuest = (questId) => {
    setQuests(prevQuests => prevQuests.map(q => {
        if (q.id === questId) {
            return {
                ...q,
                status: 'active', 
                verified_by_id: currentUser.id,
                verified_date: new Date().toISOString(),
            };
        }
        return q;
    }));
    alert('New Quest Approved and is now visible to all Travelers!');
  };

  // Admin edits an existing quest
  const updateQuest = (questId, updatedFields) => {
    setQuests(prevQuests => prevQuests.map(q => {
        if (q.id === questId) {
            return { 
                ...q, 
                ...updatedFields,
                // Ensure number fields stay as numbers
                xp_value: Number(updatedFields.xp_value || q.xp_value),
            };
        }
        return q;
    }));
    alert('Quest successfully updated!');
  };

  // Admin deletes a quest
  const deleteQuest = (questId) => {
    setQuests(prevQuests => prevQuests.filter(q => q.id !== questId));
  };


  // --- REWARD MANAGEMENT (Admin) ---
  
  // Admin edits an existing reward
  const updateReward = (rewardId, updatedFields) => {
    initialData.rewards = initialData.rewards.map(r => {
        if (r.id === rewardId) {
            return { 
                ...r, 
                ...updatedFields,
                // Ensure XP cost is a number
                xp_cost: Number(updatedFields.xp_cost || r.xp_cost),
            };
        }
        return r;
    });
    // This forces a state update for rewards in the components
    setQuests([...quests]); 
    alert('Reward updated! Please refresh the browser to see the full effect.');
  };

  // Admin deletes a reward
  const deleteReward = (rewardId) => {
    initialData.rewards = initialData.rewards.filter(r => r.id !== rewardId);
    // This forces a state update for rewards in the components
    setQuests([...quests]); 
    alert('Reward deleted! Please refresh the browser.');
  };


  // --- TRAVELER QUEST PROGRESS ACTIONS ---
  
  const acceptQuest = (questId) => {
    if (!currentUser) { setShowAuthModal(true); return false; }
    const exists = questProgress.some(p => p.traveler_id === currentUser.id && p.quest_id === questId);
    if (exists) { alert("You already accepted this!"); return false; }

    const newProgress = {
      id: Date.now().toString(), traveler_id: currentUser.id, quest_id: questId, status: 'in_progress', accepted_date: new Date().toISOString()
    };
    setQuestProgress([...questProgress, newProgress]);
    return true;
  };

  const submitProof = (progressId, note) => {
    setQuestProgress(prev => prev.map(p => 
      p.id === progressId ? { ...p, status: 'pending', completion_note: note, submitted_date: new Date().toISOString() } : p
    ));
    alert("Proof submitted for review!");
  };

  const approveSubmission = (progressId) => {
    const progress = questProgress.find(p => p.id === progressId);
    if (!progress) return;
    const quest = quests.find(q => q.id === progress.quest_id);
    
    setQuestProgress(prev => prev.map(p => 
      p.id === progressId ? { ...p, status: 'approved', verified_date: new Date().toISOString() } : p
    ));

    // Award XP and UPDATE the user in the main list
    const updatedUser = { ...currentUser, xp: currentUser.xp + quest.xp_value };
    setCurrentUser(updatedUser);
    setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
  };

  const rejectSubmission = (progressId) => {
    setQuestProgress(prev => prev.map(p => 
      p.id === progressId ? { ...p, status: 'rejected', verified_date: new Date().toISOString() } : p
    ));
    alert('Submission rejected');
  };

  const redeemReward = (reward) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return null;
    }
    if (currentUser.xp < reward.xp_cost) {
      alert("Not enough XP!");
      return null;
    }

    const code = `SQ${Date.now().toString().slice(-6)}`;
    const newRedemption = {
      id: Date.now().toString(),
      traveler_id: currentUser.id,
      reward_id: reward.id,
      redemption_code: code,
      redeemed_date: new Date().toISOString()
    };
    setRedemptions([...redemptions, newRedemption]);

    // Deduct XP and UPDATE the user in the main list
    const updatedUser = { ...currentUser, xp: currentUser.xp - reward.xp_cost };
    setCurrentUser(updatedUser);
    setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
    
    return code;
  };


  return (
    <SideQuestContext.Provider value={{
      currentUser, users, quests, questProgress, redemptions, rewards: initialData.rewards,
      showAuthModal, setShowAuthModal,
      login, logout, switchRole,
      addQuest, approveNewQuest, updateQuest, deleteQuest,
      updateReward, deleteReward,
      acceptQuest, submitProof, approveSubmission, rejectSubmission, redeemReward,
    }}>
      {children}
    </SideQuestContext.Provider>
  );
};