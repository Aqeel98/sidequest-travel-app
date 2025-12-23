import React, { createContext, useContext, useState, useEffect, useRef  } from 'react';
import { supabase } from '../supabaseClient';
import imageCompression from 'browser-image-compression';

const SideQuestContext = createContext();

export const useSideQuest = () => useContext(SideQuestContext);

export const SideQuestProvider = ({ children }) => {
  // --- 1. CORE SYSTEM STATE ---
  // These states manage the entire gamified ecosystem of SideQuest Sri Lanka
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); 

  const [quests, setQuests] = useState([]);
  const [rewards, setRewards] = useState([]); 
  const [questProgress, setQuestProgress] = useState([]); 
  const [redemptions, setRedemptions] = useState([]);
  const [users, setUsers] = useState([]); // High-level state for Admin view
  
  // PERMANENT FIX: Initialized to false. 
  // System will never trigger this unless an explicit action (Accept Quest) is taken.
  const [showAuthModal, setShowAuthModal] = useState(false);

  // MASTER SECURITY LOCK: The only email permitted to use the role-switcher
  const ADMIN_EMAIL = 'sidequestsrilanka@gmail.com';

  // --- 2. THE HARDENED BOOT SEQUENCE (The Persistence Pillar) ---
 
  // --- 2. THE SEQUENTIAL BOOT SEQUENCE (Handshake Lock Version) ---
  const isInitialBoot = useRef(true); // THE LOCK

  useEffect(() => {
    let mounted = true;

    const bootSequence = async () => {
      try {
        console.log("SQ-Step 1: Sequential Boot Started.");
        if (mounted) setIsLoading(true);

        // 1. Recover Auth Session FIRST
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        if (session && mounted) {
           console.log("SQ-Step 2: Session recovered for", session.user.email);
           // Wait fully for profile to load before moving to step 3
           await fetchProfile(session.user.id, session.user.email);
           console.log("SQ-Step 3: Profile handshake complete.");
        } else {
           console.log("SQ-Step 2: No session found. Entering Guest mode.");
        }

        // 2. Load Public Ecosystem Data
        console.log("SQ-Step 4: Syncing Quests & Rewards...");
        const [qData, rData] = await Promise.all([
          supabase.from('quests').select('*'),
          supabase.from('rewards').select('*'),
        ]);

        if (mounted) {
            setQuests(qData.data || []);
            setRewards(rData.data || []);
        }
        
      } catch (error) {
        console.error("SQ-Boot-Failure:", error.message);
      } finally {
        if (mounted) {
            // RELEASE THE LOCK: The Auth Listener is now allowed to react
            isInitialBoot.current = false; 
            setIsLoading(false);
            console.log("SQ-Step 5: Boot Sequence Finalized. Interface Unlocked.");
        }
      }
    };

    bootSequence();

    // --- AUTH STATE LISTENER (Sequential Protection) ---
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      // CRITICAL: If the boot sequence above is still running, ignore this event.
      // This prevents the "Manual Login Detected" race condition during refresh.
      if (isInitialBoot.current) {
          console.log("SQ-System: Ignoring event during boot sequence:", event);
          return;
      }

      console.log("SQ-System: Post-Boot Auth Event ->", event);

      if (event === 'SIGNED_IN' && session) {
          setShowAuthModal(false); 
          await fetchProfile(session.user.id, session.user.email);
          setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setQuestProgress([]);
        setRedemptions([]);
        setIsLoading(false);
      }
    });

    // Safety Timer: Guarantees the loader closes after 12 seconds
    const safetyTimer = setTimeout(() => {
      if (mounted && isLoading) {
        console.warn("SQ-System: Safety Override Triggered.");
        setIsLoading(false);
        isInitialBoot.current = false;
      }
    }, 12000); 

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, []); // MUST REMAIN EMPTY

  // --- 4. REALTIME DATA CHANNEL (CDC - Change Data Capture) ---
  const subscribeToProfileChanges = (userId) => {
      const channel = supabase
        .channel(`profile-updates-${userId}`)
        .on('postgres_changes', 
            { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, 
            (payload) => {
                console.log("SQ-System: Realtime XP/Level update received from Database.");
                setCurrentUser(prev => ({ ...prev, ...payload.new }));
            }
        )
        .subscribe();
      
      return () => supabase.removeChannel(channel);
  };

  // --- 5. DATA FETCHING & USER RECOVERY ---
  
  const fetchProfile = async (userId, userEmail) => {
    try {
      // maybeSingle() prevents crashes if the user record hasn't been created yet
      let { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      
      if (error) {
          console.error("SQ-System: Profile Sync Error:", error.message);
          return;
      }

      // ZOMBIE USER FIX: Detect and auto-repair profile records (missing row logic)
      if (!data) {
          console.log("SQ-System: Profile record missing. Triggering auto-repair...");
          const newProfile = { 
              id: userId, email: userEmail, full_name: userEmail.split('@')[0], 
              role: userEmail === ADMIN_EMAIL ? 'Admin' : 'Traveler',
              xp: 0
          };
          const { data: created, error: createError } = await supabase
              .from('profiles').upsert([newProfile]).select().single();
          
          if (!createError) {
              data = created;
              console.log("SQ-System: Profile record repaired successfully.");
          }
      }

      if (data) {
          // Hardcoded Admin Logic: Email master check override
          if (data.email === ADMIN_EMAIL) data.role = 'Admin';
          
          setCurrentUser(data);
          subscribeToProfileChanges(userId);
          
          // Sync history and submissions in parallel for performance
          await Promise.all([
             fetchSubmissions(userId, data.role),
             fetchRedemptions(userId)
          ]);
      }
    } catch (err) {
      console.error("SQ-System: Critical profile recovery failure.", err);
    }
  };

  const fetchQuests = async () => {
    const { data, error } = await supabase.from('quests').select('*');
    if (!error) setQuests(data || []);
  };

  const fetchRewards = async () => {
    const { data, error } = await supabase.from('rewards').select('*');
    if (!error) setRewards(data || []);
  };

  const fetchRedemptions = async (userId) => {
    const { data, error } = await supabase.from('redemptions').select('*').eq('traveler_id', userId);
    if (!error) setRedemptions(data || []);
  };

  const fetchSubmissions = async (userId, role) => {
    try {
        if (role === 'Admin') {
            // Admin omnipotence: Load all traveler proofs and all profiles
            const { data: subs } = await supabase.from('submissions').select('*');
            setQuestProgress(subs || []);
            const { data: allUsers } = await supabase.from('profiles').select('*');
            setUsers(allUsers || []);
        } else {
            // Standard Traveler view: Restricted to own submissions
            const { data: mySubs } = await supabase.from('submissions').select('*').eq('traveler_id', userId);
            setQuestProgress(mySubs || []);
        }
    } catch (e) {
        console.error("SQ-System: Submission sync failed.", e);
    }
  };

  // --- 6. AUTHENTICATION ENGINE ---

  const login = async (email, password) => {
    try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error; 
        // Note: Success state is handled by the master listener for better sync
    } catch (err) {
        console.error("SQ-System: Login Failure:", err.message);
        throw err;
    }
  };

  const signup = async (email, password, name, role) => {
    try {
        console.log(`SQ-System: Initiating registration for role: ${role}`);
        const { data, error } = await supabase.auth.signUp({ email, password });
        
        if (error) throw error;

        if (data.user) {
            // 1. Assign Role Logic (Priority: Master Admin Email > Selected UI Role)
            const finalRole = email === ADMIN_EMAIL ? 'Admin' : role;
            
            const newProfile = { 
                id: data.user.id, 
                email: email, 
                full_name: name, 
                role: finalRole, // This is either 'Traveler' or 'Partner'
                xp: 0 
            };

            // 2. Create the profile and SELECT it back immediately
            const { data: createdProfile, error: profileError } = await supabase
                .from('profiles')
                .upsert([newProfile])
                .select()
                .single();
            
            if (profileError) {
                console.error("SQ-System: Profile record failed to save.");
                throw profileError;
            }

            // --- FORCED UI HYDRATION ---
            // We set the React State NOW instead of waiting for the background listener.
            // This ensures the "Partner Dashboard" or "Traveler Profile" appears instantly.
            setCurrentUser(createdProfile);
            
            // 3. Initialize the user's ecosystem immediately
            subscribeToProfileChanges(data.user.id);
            
            // Pre-fetch submissions specific to their new role
            await fetchSubmissions(data.user.id, createdProfile.role);

            console.log(`SQ-System: ${createdProfile.role} registered successfully.`);
            
            // Personalized welcome message based on role
            if (createdProfile.role === 'Partner') {
                alert(`Welcome ${name}! Your Partner Dashboard is now active.`);
            } else if (createdProfile.role === 'Admin') {
                alert(`System Administrator Access Granted.`);
            } else {
                alert(`Welcome Adventurer ${name}! Your journey begins now.`);
            }
        }
    } catch (err) {
        console.error("SQ-System: Signup Process Halted:", err.message);
        throw err; // Re-throw so AuthModal can show the error
    }
  };

  const logout = async () => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        console.log("SQ-System: Manual sign-out performed.");
    } catch (err) {
        console.error("SQ-System: Logout error", err.message);
    }
  };

  // --- 7. QUEST MANAGEMENT & PARTICIPATION ---

  const addQuest = async (formData, imageFile) => {
    try {
        let imageUrl = null;
        if (imageFile) {
            // Speed Optimize: Image compression for Partner uploads
            const options = { maxSizeMB: 1, maxWidthOrHeight: 1600, useWebWorker: true };
            const optimized = await imageCompression(imageFile, options);
            
            const fileName = `quest-images/${Date.now()}_${imageFile.name.replace(/\s/g, '')}`;
            const { error: uploadError } = await supabase.storage.from('proofs').upload(fileName, optimized);
            
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
        alert("Impact Quest created and queued for review!");
        fetchQuests(); 
        return true; 
    } catch (error) {
        console.error("SQ-System: Quest Addition Failure", error);
        alert("Failed to submit quest: " + error.message);
        return false;
    }
  };

  const updateQuest = async (id, updates) => {
    try {
        console.log("SQ-System: Hardening Quest Update Payload...");

        // 1. Strip all metadata and protected fields
        const { id: _id, created_at, created_by, ...payload } = updates;

        // 2. FORCE correct data types
        const xp_value = payload.xp_value ? Number(payload.xp_value) : 0;
        const lat = payload.lat ? parseFloat(payload.lat) : 0;
        const lng = payload.lng ? parseFloat(payload.lng) : 0;

        // 3. SECURE STATUS OVERRIDE
        // We delete any status coming from the form so it cannot override us.
        delete payload.status; 
        
        const finalStatus = currentUser?.role === 'Admin' ? (updates.status || 'active') : 'pending_admin';

        const { data, error } = await supabase
            .from('quests')
            .update({
                ...payload,
                xp_value,
                lat,
                lng,
                status: finalStatus
            })
            .eq('id', Number(id))
            .select(); // Select back to verify

        if (error) throw error;
        
        console.log("SQ-System: Database confirmed update to status:", data[0].status);

        // 4. Refresh global quests state
        await fetchQuests(); 

        if (currentUser?.role === 'Partner') {
            alert("Success! Your changes are saved. The quest is now 'In Review' and hidden from the map until Admin approval.");
        } else {
            alert("Quest updated successfully.");
        }

    } catch (error) {
        console.error("SQ-System: Update Logic Failure", error);
        alert("Update Failed: " + error.message);
    }
  }; 
  
  const deleteQuest = async (id) => {
    try {
        const { error } = await supabase.from('quests').delete().eq('id', id);
        if (error) throw error;
        setQuests(prevQuests => prevQuests.filter(q => q.id !== id));
        alert("Quest permanently removed from ecosystem.");
    } catch (error) {
        console.error("SQ-System: Delete Error", error);
        alert("Deletion failed: " + error.message);
    }
  };
  
  const acceptQuest = async (questId) => {
    // SECURITY: Guests must login before accepting a quest
    if (!currentUser) {
        setShowAuthModal(true);
        return false;
    }
    try {
        const { data, error } = await supabase.from('submissions').insert([{
            quest_id: questId, traveler_id: currentUser.id, status: 'in_progress'
        }]).select();
        
        if (error) throw error;
        if (data && data.length > 0) {
            setQuestProgress([...questProgress, data[0]]); 
            console.log("SQ-System: Quest accepted by traveler.");
            return true; 
        }
        return false;
    } catch (error) {
        console.error("SQ-System: Acceptance error", error);
        alert("Unable to join quest. Please try again.");
        return false;
    }
  };

  // --- SUBMIT PROOF ENGINE (ACCURACY FIX: Compression + Handshake Sync) ---
  const submitProof = async (questId, note, file) => {
    try {
        let proofUrl = null;
        if (file) {
            // ACCURACY FIX: Compression ensures travelers don't hang on 4G
            console.log("SQ-System: Optimizing proof image...");
            const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1280, useWebWorker: true };
            const compressedFile = await imageCompression(file, options);
            
            const fileName = `proofs/${Date.now()}_${file.name.replace(/\s/g, '')}`;
            const { error: uploadErr } = await supabase.storage.from('proofs').upload(fileName, compressedFile);
            
            if (uploadErr) { 
                alert("Mobile data signal weak. Upload failed."); 
                return false; 
            }
            const { data } = supabase.storage.from('proofs').getPublicUrl(fileName);
            proofUrl = data.publicUrl;
        }

        const existing = questProgress.find(p => p.quest_id === questId && p.traveler_id === currentUser.id);
        const payload = { 
            status: 'pending', 
            completion_note: note, 
            proof_photo_url: proofUrl, 
            submitted_at: new Date() 
        };
        
        if (existing) {
            const { data, error: updateErr } = await supabase.from('submissions').update(payload).eq('id', existing.id).select();
            if (updateErr) throw updateErr;
            // Immediate state handshake for UI responsiveness
            setQuestProgress(questProgress.map(p => p.id === existing.id ? data[0] : p));
        } else {
            const { data, error: insertErr } = await supabase.from('submissions').insert([{
                ...payload, quest_id: questId, traveler_id: currentUser.id
            }]).select();
            if (insertErr) throw insertErr;
            setQuestProgress([...questProgress, data[0]]);
        }
        alert("Impact Proof Submitted! Verified Travelers will receive XP soon.");
        return true;
    } catch (err) {
        console.error("SQ-System: Submission Critical Error", err);
        alert("Submission failure. Please retry.");
        return false;
    }
  };

  // --- 8. REWARD ECONOMY ACTIONS ---

  const addReward = async (formData, imageFile) => {
    try {
        let imageUrl = null;
        if (imageFile) {
            const fileName = `reward-images/${Date.now()}_${imageFile.name.replace(/\s/g, '')}`;
            await supabase.storage.from('proofs').upload(fileName, imageFile);
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
        alert("New Reward queued for moderation.");
        fetchRewards();
        return true;
    } catch (error) {
        console.error("SQ-System: Reward Addition Failure", error);
        alert("Failed to submit reward.");
        return false;
    }
  };

  const updateReward = async (id, updates) => {
    try {
        console.log(`SQ-System: Processing update for Reward ID: ${id}`);

        // 1. DATA INTEGRITY CLEANUP:
        // We strip 'id', 'created_at', and 'created_by' from the updates object.
        // This ensures Supabase doesn't throw a "cannot update primary key" error.
        const { id: _id, created_at, created_by, ...cleanUpdates } = updates;

        // 2. MODERATION LOGIC:
        // If a Partner edits, the reward is set to 'pending_admin' (removed from market).
        // If an Admin edits, they can keep it 'active'.
        const finalUpdates = {
            ...cleanUpdates,
            status: currentUser?.role === 'Admin' ? (cleanUpdates.status || 'active') : 'pending_admin'
        };

        // 3. DATABASE UPDATE:
        // Casting the ID to a Number ensures it matches the PostgreSQL integer schema.
        const { error } = await supabase
            .from('rewards')
            .update(finalUpdates)
            .eq('id', Number(id));

        if (error) {
            console.error("SQ-System: Reward Update DB Error:", error.message);
            throw error;
        }
        
        // 4. LOCAL STATE SYNC:
        // Refresh the rewards marketplace so everyone sees the latest (or removal).
        await fetchRewards(); 

        // 5. ACCURATE FEEDBACK:
        if (currentUser?.role === 'Partner') {
            alert("Marketplace reward updated and sent to Admin for re-approval. It will be hidden until reviewed.");
        } else {
            alert("Marketplace Reward updated successfully.");
        }

    } catch (error) {
        console.error("SQ-System: Reward Update Failure", error);
        alert("Update Failed: " + error.message);
    }
  };


  const deleteReward = async (id) => {
      try {
        const { error } = await supabase.from('rewards').delete().eq('id', id);
        if (error) throw error;
        fetchRewards();
        alert("Reward removed from marketplace.");
      } catch (error) {
        console.error("SQ-System: Reward Deletion Failure", error);
        alert("Deletion failed.");
      }
  };

  const redeemReward = async (reward) => {
      if (currentUser.xp < reward.xp_cost) {
          alert("Insufficient Impact Points (XP) for this reward!");
          return null;
      }
      const code = `SQ-${Date.now().toString().slice(-6)}`;
      
      // Update local wallet first to prevent race condition
      const { error: xpError } = await supabase.from('profiles').update({ xp: currentUser.xp - reward.xp_cost }).eq('id', currentUser.id);
      
      if (!xpError) {
          // Record record transaction history
          const { data, error: redError } = await supabase.from('redemptions').insert([{
              traveler_id: currentUser.id, reward_id: reward.id, redemption_code: code
          }]).select();
          
          if (redError) {
              console.error("SQ-System: Redemption record failure.", redError);
              throw redError;
          }

          // Sync local wallet and redemptions list
          setCurrentUser({...currentUser, xp: currentUser.xp - reward.xp_cost});
          setRedemptions([...redemptions, data[0]]);
          console.log("SQ-System: Reward successfully redeemed.");
          return code;
      }
      return null;
  };

  // --- 9. ADMIN OVERSIGHT ACTIONS ---

  const approveSubmission = async (submissionId) => {
    const sub = questProgress.find(p => p.id === submissionId);
    if (!sub) return; 
    const quest = quests.find(q => q.id === sub.quest_id);
    if (!quest) return; 

    try {
        // 1. Set verification status to approved
        await supabase.from('submissions').update({ status: 'approved' }).eq('id', submissionId);
        
        // 2. Safely calculate and award Impact Points
        const { data: traveler } = await supabase.from('profiles').select('xp').eq('id', sub.traveler_id).single();
        if (!traveler) throw new Error("Traveler record not found.");

        const newXp = (traveler.xp || 0) + quest.xp_value;
        await supabase.from('profiles').update({ xp: newXp }).eq('id', sub.traveler_id);

        console.log("SQ-System: Submission verified. XP points awarded.");
        alert("Verification Complete! XP has been sent to the adventurer.");
        fetchSubmissions(currentUser.id, 'Admin'); 
    } catch (e) {
        console.error("SQ-System: Oversight error", e);
        alert("Action failed: " + e.message);
    }
  };

  const rejectSubmission = async (id) => {
      try {
        await supabase.from('submissions').update({ status: 'rejected' }).eq('id', id);
        alert("Submission Rejected. Traveler notified.");
        fetchSubmissions(currentUser.id, 'Admin');
      } catch (e) { console.error(e); }
  };
  
  const approveNewQuest = async (id) => {
      try {
        await supabase.from('quests').update({ status: 'active' }).eq('id', id);
        alert("Partner Quest approved and published to map.");
        fetchQuests();
      } catch (e) { console.error(e); }
  };

  const approveNewReward = async (id) => {
      try {
        await supabase.from('rewards').update({ status: 'active' }).eq('id', id);
        alert("Partner Reward approved and published to marketplace.");
        fetchRewards();
      } catch (e) { console.error(e); }
  };

  // --- 10. THE MASTER ADMIN DEEPLINK SWITCHER ---
  const switchRole = (role) => {
    if (!currentUser) {
        alert("Auth required.");
        return;
    }

    // MANDATORY SECURITY: Verify identity before allowing view-state manipulation
    if (currentUser.email !== ADMIN_EMAIL) {
        console.warn("SQ-System: Manual role-switch attempted by non-authorized account.");
        return; 
    }

    console.log(`SQ-System: System Admin switching view context to ${role}`);
    
    // Switch local state role context
    setCurrentUser({ ...currentUser, role: role });
    
    // Immediately refresh data pools to match the new role view
    fetchSubmissions(currentUser.id, role);
  };

  // --- RENDER PROVIDER ---
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