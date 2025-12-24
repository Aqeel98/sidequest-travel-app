import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import imageCompression from 'browser-image-compression';

/**
 * SideQuestContext: The central nervous system of the platform.
 * Handles Auth, Persistence, Realtime DB Sync, and Gamification.
 */
const SideQuestContext = createContext();

export const useSideQuest = () => useContext(SideQuestContext);

export const SideQuestProvider = ({ children }) => {
  // --- 1. GLOBAL SYSTEM STATE ---
  // Core user identity and session persistence
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); 

  // Ecosystem content pools
  const [quests, setQuests] = useState([]);
  const [rewards, setRewards] = useState([]); 
  const [questProgress, setQuestProgress] = useState([]); 
  const [redemptions, setRedemptions] = useState([]);
  
  // Administrative data pools
  const [users, setUsers] = useState([]); 
  
  // UI State Management
  // Initialized to FALSE to ensure Guests never see a login-wall on Home Page
  const [showAuthModal, setShowAuthModal] = useState(false);

    // --- NEW: NOTIFICATION SYSTEM ---
  const [toast, setToast] = useState(null); 

  const showToast = (message, type = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 4000); // Auto-hide after 4 seconds
  };
    
  // LOGIC LOCK: THE RACE CONDITION SHIELD
  // This ref prevents Auth Listeners from interrupting the Sequential Boot Sequence
  const isInitialBoot = useRef(true);

  // MASTER SECURITY CONSTANT
  const ADMIN_EMAIL = 'sidequestsrilanka@gmail.com';

  // --- 2. THE HARDENED SEQUENTIAL BOOT (Persistence & Guest Logic) ---
  /**
   * This effect runs exactly once when the application mounts.
   * It performs a 5-step handshake to ensure the user is correctly identified.
   */
  useEffect(() => {
    let mounted = true;
    
    // Initialize the Realtime ecosystem "Ears"
    const ecosystemSync = subscribeToEcosystemChanges();

    const bootSequence = async () => {
      try {
        console.log("SQ-Step 1: Initiating Sequential Boot Sequence...");
        
        if (mounted) {
            setIsLoading(true);
            // GUEST GUARD: Force modal closed during system initialization
            setShowAuthModal(false); 
        }

        // --- HANDSHAKE A: PUBLIC DATA SYNC ---
        console.log("SQ-Step 2: Syncing public ecosystem data pools...");
        const { data: qData, error: qErr } = await supabase.from('quests').select('*');
        const { data: rData, error: rErr } = await supabase.from('rewards').select('*');

        if (qErr) console.error("SQ-Boot: Quest sync failed ->", qErr.message);
        if (rErr) console.error("SQ-Boot: Reward sync failed ->", rErr.message);

        if (mounted) {
            setQuests(qData || []);
            setRewards(rData || []);
            console.log("SQ-Step 2: Quests and Rewards synchronized for Guest/User.");
        }

        // --- HANDSHAKE B: SESSION RECOVERY (The Persistence Pillar) ---
        console.log("SQ-Step 3: Checking LocalStorage for existing session token...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
            console.warn("SQ-Step 3: Session recovery encountered an error.");
            throw sessionError;
        }

        if (session && mounted) {
           console.log("SQ-Step 4: Active session detected for:", session.user.email);
           // CRITICAL: We await the full profile load before we turn off the loading screen.
           // This prevents the "Login Flash" and accidental logouts on refresh.
           await fetchProfile(session.user.id, session.user.email);
           console.log("SQ-Step 4: Profile and user history handshaked successfully.");
        } else {
           console.log("SQ-Step 4: No active session. Transitioning to Silent Guest Mode.");
           // FINAL POPUP KILL: Force ensure modal stays closed for guests
           if (mounted) setShowAuthModal(false);
        }
        
      } catch (error) {
        console.error("SQ-Boot-Failure: The system failed to initialize properly ->", error.message);
      } finally {
        if (mounted) {
            // RELEASE THE LOCK: The system is now ready for manual user events
            isInitialBoot.current = false; 
            setIsLoading(false);
            console.log("SQ-Step 5: Sequential Boot Finalized. Application Unlocked.");
        }
      }
    };

    bootSequence();

    // --- 3. THE MASTER AUTH LISTENER (Real-time Handshake Sync) ---
    /**
     * This listener handles SIGNED_IN, SIGNED_OUT, and TOKEN_REFRESH events.
     * It is blocked by isInitialBoot during the first 5 seconds to prevent race conditions.
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      // CRITICAL GUARD: If the boot sequence is currently handshaking, ignore these events.
      if (isInitialBoot.current) {
          console.log("SQ-System: Ignoring background auth event during boot lock:", event);
          return;
      }

      console.log("SQ-System: Post-Boot Auth Event Handshake ->", event);

      if (session) {
          // Sync profile only if the local state is currently empty
          if (!currentUser) {
            console.log("SQ-System: Hydrating local user state from database...");
            await fetchProfile(session.user.id, session.user.email);
          }
          // PERMANENT FIX: Close modal instantly upon session confirmation.
          // This stops the "Processing..." hang.
          setShowAuthModal(false); 
      } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        console.log("SQ-System: Authentication purged. Cleaning all local data pools.");
        setCurrentUser(null);
        setQuestProgress([]);
        setRedemptions([]);
        setUsers([]);
        setShowAuthModal(false); 
        setIsLoading(false);
      }
    });

    // Safety Timer: High-resilience protection for Sri Lankan mobile networks.
    // If boot takes > 12s, we force open the gateway to prevent infinite loading.
    const safetyTimer = setTimeout(() => {
      if (mounted && isLoading) {
        console.warn("SQ-System: Network latency threshold exceeded. Safety override triggered.");
        setIsLoading(false);
        isInitialBoot.current = false;
      }
    }, 12000); 

    return () => {
      mounted = false;
      if (ecosystemSync) ecosystemSync.unsubscribe(); 
      subscription.unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, []); // EMPTY ARRAY: Essential for session persistence

  // --- 4. REALTIME DATA CHANNELS (CDC - Change Data Capture) ---
  
  /**
   * Ecosystem Listener: Ensures the Admin sees Partner edits instantly
   * and the Home Page updates as soon as a Quest becomes active.
   */
  /**
   * Ecosystem Listener: Listens to Quests, Rewards, AND Proofs.
   * Updates state immediately + Triggers Notifications.
   */
  const subscribeToEcosystemChanges = () => {
    return supabase
      .channel('ecosystem-sync')
      
      // 1. QUESTS (Partner/Admin Updates)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quests' }, (payload) => {
          if (payload.eventType === 'UPDATE') {
              setQuests(current => current.map(q => q.id === payload.new.id ? payload.new : q));
              // Notify if a quest goes LIVE
              if (payload.new.status === 'active') showToast(`Quest "${payload.new.title}" is now LIVE!`, 'success');
          } else if (payload.eventType === 'INSERT') {
              setQuests(current => [...current, payload.new]);
          } else if (payload.eventType === 'DELETE') {
              setQuests(current => current.filter(q => q.id !== payload.old.id));
          }
      })
      
      // 2. REWARDS (Marketplace Updates)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rewards' }, (payload) => {
          if (payload.eventType === 'UPDATE') {
              setRewards(current => current.map(r => r.id === payload.new.id ? payload.new : r));
          } else if (payload.eventType === 'INSERT') {
              setRewards(current => [...current, payload.new]);
          } else if (payload.eventType === 'DELETE') {
              setRewards(current => current.filter(r => r.id !== payload.old.id));
          }
      })

      // 3. SUBMISSIONS (Smart Logic)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, (payload) => {
          
        if (payload.eventType === 'INSERT') {
            // A. FIX DUPLICATES: Only add if it doesn't exist yet
            setQuestProgress(prev => {
                if (prev.find(p => p.id === payload.new.id)) return prev;
                return [...prev, payload.new];
            });

            // B. FIX NOTIFICATION: Only notify if it's actually a submission (status='pending')
            // When a user just accepts a quest, status is 'in_progress', so we do nothing.
            if (payload.new.status === 'pending') {
                showToast("New Proof Submitted!", 'info');
            }
        } 
        else if (payload.eventType === 'UPDATE') {
            setQuestProgress(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
            
            // C. DETECT SUBMISSION HERE (Status changed from in_progress -> pending)
            if (payload.new.status === 'pending') showToast("Proof Submitted for Review!", 'info');
            
            if (payload.new.status === 'approved') showToast("Quest Approved! +XP Awarded", 'success');
            if (payload.new.status === 'rejected') showToast("Proof Rejected. Check My Quests.", 'error');
        }
    })
    .subscribe();
  };

  /**
   * Profile Listener: Ensures Traveler XP badges update without refresh.
   */
  const subscribeToProfileChanges = (userId) => {
      const channel = supabase
        .channel(`profile-updates-${userId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, 
            (payload) => { 
                console.log("SQ-Realtime: User Profile Data updated in DB. Syncing UI.");
                setCurrentUser(prev => ({ ...prev, ...payload.new })); 
            }
        )
        .subscribe();
      
      return () => supabase.removeChannel(channel);
  };

  // --- 5. DATA SYNC & ZOMBIE REPAIR LOGIC ---
  
  const fetchProfile = async (userId, userEmail) => {
    try {
      console.log("SQ-Profile: Initiating database handshake for:", userEmail);
      
      let { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      
      if (error) {
          console.error("SQ-Profile: Database retrieval failed:", error.message);
          return;
      }

      // ZOMBIE USER REPAIR: Fix profiles that exist in Auth but not in the Profiles table
      if (!data) {
          console.log("SQ-Profile: CRITICAL - Profile record missing. Repairing database integrity...");
          const newProfile = { 
              id: userId, 
              email: userEmail, 
              full_name: userEmail.split('@')[0], 
              role: userEmail === ADMIN_EMAIL ? 'Admin' : 'Traveler',
              xp: 0
          };
          
          const { data: repaired, error: createError } = await supabase
              .from('profiles')
              .upsert([newProfile])
              .select()
              .single();
          
          if (!createError) {
              data = repaired;
              console.log("SQ-Profile: Database record successfully repaired.");
          } else {
              console.error("SQ-Profile: Manual repair failed ->", createError.message);
          }
      }

      if (data) {
          // Hardcoded System Admin Override
          if (data.email === ADMIN_EMAIL) data.role = 'Admin';
          
          setCurrentUser(data);
          subscribeToProfileChanges(userId);
          
          // Load user-specific submissions and redemptions in parallel for efficiency
          await Promise.all([
             fetchSubmissions(userId, data.role),
             fetchRedemptions(userId)
          ]);
      }
    } catch (err) {
      console.error("SQ-Profile: Critical profile handshake failure.", err);
    }
  };

  const fetchQuests = async () => {
    try {
        const { data, error } = await supabase.from('quests').select('*');
        if (!error) {
            setQuests(data || []);
            console.log("SQ-Data: Global quest pool refreshed.");
        }
    } catch (e) { console.error(e); }
  };

  const fetchRewards = async () => {
    try {
        const { data, error } = await supabase.from('rewards').select('*');
        if (!error) {
            setRewards(data || []);
            console.log("SQ-Data: Global rewards pool refreshed.");
        }
    } catch (e) { console.error(e); }
  };

  const fetchRedemptions = async (userId) => {
    try {
        const { data, error } = await supabase.from('redemptions').select('*').eq('traveler_id', userId);
        if (!error) {
            setRedemptions(data || []);
            console.log("SQ-Data: User redemptions history synced.");
        }
    } catch (e) { console.error(e); }
  };

  const fetchSubmissions = async (userId, role) => {
    try {
        if (role === 'Admin') {
            console.log("SQ-Admin: Fetching global submission oversight data...");
            const { data: subs, error: subErr } = await supabase.from('submissions').select('*');
            if (!subErr) setQuestProgress(subs || []);
            
            const { data: allUsers, error: uErr } = await supabase.from('profiles').select('*');
            if (!uErr) setUsers(allUsers || []);
        } else {
            console.log("SQ-Traveler: Fetching personal impact submissions...");
            const { data: mySubs, error: myErr } = await supabase.from('submissions').select('*').eq('traveler_id', userId);
            if (!myErr) setQuestProgress(mySubs || []);
        }
    } catch (e) {
        console.error("SQ-System: Submission sync failed.", e);
    }
  };

  // --- 6. AUTHENTICATION ENGINE ---

  const login = async (email, password) => {
    try {
        console.log("SQ-Auth: Attempting secure sign-in...");
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error; 
        console.log("SQ-Auth: Credentials verified.");
    } catch (err) {
        console.error("SQ-Auth: Login failure ->", err.message);
        throw err;
    }
  };

  const signup = async (email, password, name, role) => {
    try {
        console.log(`SQ-Auth: Registering new adventurer account as: ${role}`);
        const { data, error } = await supabase.auth.signUp({ email, password });
        
        if (error) throw error;

        if (data.user) {
            const finalRole = email === ADMIN_EMAIL ? 'Admin' : role;
            const newProfile = { 
                id: data.user.id, 
                email: email, 
                full_name: name, 
                role: finalRole, 
                xp: 0 
            };
            
            // Create database entry immediately after Auth signup
            const { data: createdProfile, error: profileError } = await supabase
                .from('profiles')
                .upsert([newProfile])
                .select()
                .single();
            
            if (profileError) throw profileError;

            // FORCED HYDRATION: Update state instantly to kill dashboard lag
            if (createdProfile) {
                setCurrentUser(createdProfile);
                subscribeToProfileChanges(data.user.id);
                await fetchSubmissions(data.user.id, createdProfile.role);
                console.log("SQ-Auth: Identity Hydration complete.");
            }

            alert(`Welcome to SideQuest, ${name}! Your profile is ready.`);
        }
    } catch (err) {
        console.error("SQ-Auth: Registration Halted ->", err.message);
        throw err; 
    }
  };

  const logout = async () => {
    try {
        console.log("SQ-Auth: Initiating secure sign-out...");
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        console.log("SQ-Auth: Session terminated successfully.");
    } catch (error) {
        console.error("SQ-Auth: Sign-out failure ->", error.message);
    }
  };

  // --- 7. QUEST & IMPACT ACTIONS ---

  const addQuest = async (formData, imageFile) => {
    try {
        console.log("SQ-Quest: Initiating new quest creation...");
        let imageUrl = null;
        if (imageFile) {
            // SPEED FIX: Compression before upload for Sri Lankan mobile 4G
            const options = { maxSizeMB: 1, maxWidthOrHeight: 1600, useWebWorker: true };
            const optimized = await imageCompression(imageFile, options);
            
            const fileName = `quest-images/${Date.now()}_${imageFile.name.replace(/\s/g, '')}`;
            const { error: uploadErr } = await supabase.storage.from('proofs').upload(fileName, optimized);
            
            if (uploadErr) throw uploadErr;
            imageUrl = supabase.storage.from('proofs').getPublicUrl(fileName).data.publicUrl;
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
        console.log("SQ-Quest: Quest record successfully saved.");
        alert("Success! Your Impact Quest has been sent to the Game Master for moderation.");
        return true; 
    } catch (error) {
        console.error("SQ-Quest: Creation Failure ->", error.message);
        alert("Submission failed: " + error.message);
        return false;
    }
  };

  const updateQuest = async (id, updates) => {
    try {
        console.log(`SQ-System: Hardening Update Logic for Quest ID: ${id}`);
        
        const { id: _id, created_at, created_by, ...payload } = updates;
        delete payload.status; 
        
        const finalStatus = currentUser?.role === 'Admin' ? (updates.status || 'active') : 'pending_admin';

        // CHANGE HERE: Added .select() to the end
        const { data, error } = await supabase.from('quests').update({
            ...payload, 
            xp_value: Number(payload.xp_value), 
            lat: parseFloat(payload.lat), 
            lng: parseFloat(payload.lng), 
            status: finalStatus
        }).eq('id', Number(id)).select(); // <--- CRITICAL ADDITION

        if (error) {
            console.error("SQ-Quest: Update rejected by Database.");
            throw error;
        }

        // CHECK IF DATA WAS ACTUALLY UPDATED
        if (!data || data.length === 0) {
            console.error("SQ-Quest: RLS Policy blocked this update! No rows changed.");
            alert("Error: You do not have permission to edit this quest.");
            return;
        }
        
        // Update Local State
        setQuests(prev => prev.map(q => q.id === Number(id) ? { ...q, ...payload, status: finalStatus } : q));
        
        if (currentUser?.role === 'Partner') {
            alert("Changes saved. Your quest is now 'In Review'.");
        } else {
            alert("Updated.");
        }
    } catch (error) { 
        console.error("SQ-Quest: Critical update failure ->", error.message);
        alert("Update Failed: " + error.message); 
    }
  };

  
  const deleteQuest = async (id) => {
    try {
        console.log(`SQ-Quest: Attempting to remove quest: ${id}`);
        const { error } = await supabase.from('quests').delete().eq('id', id);
        if (error) throw error;
        
        setQuests(prev => prev.filter(q => q.id !== id));
        console.log("SQ-Quest: Deletion verified.");
        alert("Impact Quest successfully removed from the ecosystem.");
    } catch (error) { 
        console.error("SQ-Quest: Deletion error ->", error.message);
        alert("Deletion failed."); 
    }
  };
  
  const acceptQuest = async (questId) => {
    // 1. Check Login
    if (!currentUser) {
        setShowAuthModal(true);
        return false;
    }
    
    try {
        console.log(`SQ-Quest: Traveler accepting quest: ${questId}`);
        
        // 2. Insert into DB (Don't need .select() anymore)
        const { error } = await supabase.from('submissions').insert([{
            quest_id: questId, 
            traveler_id: currentUser.id, 
            status: 'in_progress'
        }]);
        
        if (error) throw error;
        
        // 3. DO NOT update local state here. 
        // The Realtime Listener will catch the INSERT and update the UI automatically.
        
        console.log("SQ-Quest: Quest join successful.");
        return true; 
        
    } catch (error) {
        console.error("SQ-Quest: Acceptance error ->", error.message);
        alert("Action failed. Please check your connection.");
        return false;
    }
  };

  const submitProof = async (questId, note, file) => {
    try {
        console.log(`SQ-Impact: Processing proof submission for Quest: ${questId}`);
        let proofUrl = null;
        
        if (file) {
            // SPEED FIX: Proof compression is critical for travelers on the move
            console.log("SQ-Impact: Optimizing high-res proof photo...");
            const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1280, useWebWorker: true };
            const compressed = await imageCompression(file, options);
            
            const fileName = `proofs/${Date.now()}_${file.name.replace(/\s/g, '')}`;
            const { error: uploadErr } = await supabase.storage.from('proofs').upload(fileName, compressed);
            
            if (uploadErr) {
                console.error("SQ-Impact: Image upload failure.");
                alert("Upload failed. Ensure you have a clear signal.");
                return false;
            }
            proofUrl = supabase.storage.from('proofs').getPublicUrl(fileName).data.publicUrl;
        }

        const existing = questProgress.find(p => p.quest_id === questId && p.traveler_id === currentUser.id);
        const payload = { 
            status: 'pending', 
            completion_note: note, 
            proof_photo_url: proofUrl, 
            submitted_at: new Date() 
        };
        
        if (existing) {
            console.log("SQ-Impact: Updating existing submission record.");
            const { data, error: upErr } = await supabase.from('submissions').update(payload).eq('id', existing.id).select();
            if (upErr) throw upErr;
            // Immediate state sync
            setQuestProgress(prev => prev.map(p => p.id === existing.id ? data[0] : p));
        } else {
            console.log("SQ-Impact: Creating new submission record.");
            const { data, error: insErr } = await supabase.from('submissions').insert([{
                ...payload, quest_id: questId, traveler_id: currentUser.id
            }]).select();
            if (insErr) throw insErr;
            setQuestProgress(prev => [...prev, data[0]]);
        }
        
        console.log("SQ-Impact: Proof successfully queued for Admin review.");
        alert("Impact Proof Submitted! Verified Travelers will receive XP rewards soon.");
        return true;
    } catch (err) {
        console.error("SQ-Impact: Submission critical failure ->", err.message);
        alert("Failure: " + err.message);
        return false;
    }
  };

  // --- 8. REWARD ECONOMY ACTIONS ---

  const addReward = async (formData, imageFile) => {
    try {
        console.log("SQ-Market: Adding new reward to marketplace...");
        let imageUrl = null;
        if (imageFile) {
            const fileName = `reward-images/${Date.now()}_${imageFile.name.replace(/\s/g, '')}`;
            const { error: uploadErr } = await supabase.storage.from('proofs').upload(fileName, imageFile);
            if (uploadErr) throw uploadErr;
            imageUrl = supabase.storage.from('proofs').getPublicUrl(fileName).data.publicUrl;
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
        console.log("SQ-Market: Reward record saved.");
        alert("Success! Your Reward is now in the review queue.");
        return true;
    } catch (error) {
        console.error("SQ-Market: Reward addition error ->", error.message);
        alert("Reward submission failed.");
        return false;
    }
  };

  const updateReward = async (id, updates) => {
    try {
        console.log(`SQ-Market: Hardening Update Logic for Reward ID: ${id}`);
        const { id: _id, created_at, created_by, ...payload } = updates;
        
        // Remove status to ensure the moderation override wins
        delete payload.status;
        const finalStatus = currentUser?.role === 'Admin' ? (updates.status || 'active') : 'pending_admin';
        
        const { error } = await supabase.from('rewards').update({ 
          ...payload, 
          xp_cost: Number(payload.xp_cost), 
          status: finalStatus 
        }).eq('id', Number(id));
        
        if (error) throw error;
        
        // --- ACCURACY FIX: IMMEDIATE LOCAL STATE SYNC ---
        setRewards(prev => prev.map(r => r.id === Number(id) ? { ...r, ...payload, status: finalStatus } : r));
        
        console.log("SQ-Market: Reward update confirmed.");
        alert(currentUser?.role === 'Partner' ? "Reward hidden and sent for Admin re-approval." : "Reward updated.");
    } catch (error) { 
        console.error("SQ-Market: Update failure ->", error.message);
        alert("Update failed."); 
    }
  };

  const deleteReward = async (id) => {
      try {
        console.log(`SQ-Market: Deleting reward: ${id}`);
        const { error } = await supabase.from('rewards').delete().eq('id', id);
        if (error) throw error;
        
        setRewards(prev => prev.filter(r => r.id !== id));
        console.log("SQ-Market: Reward successfully purged.");
        alert("Reward removed from the marketplace.");
      } catch (error) { 
        console.error("SQ-Market: Deletion error ->", error.message);
        alert("Deletion failed."); 
      }
  };

  const redeemReward = async (reward) => {
      console.log(`SQ-Market: Traveler initiating redemption for: ${reward.title}`);
      
      if (currentUser.xp < reward.xp_cost) {
          console.warn("SQ-Market: Insufficient traveler balance.");
          alert("Insufficient Impact Points (XP) for this reward!");
          return null;
      }
      
      const code = `SQ-${Date.now().toString().slice(-6)}`;
      
      // Update local wallet first to ensure accuracy
      const { error: xpError } = await supabase.from('profiles').update({ xp: currentUser.xp - reward.xp_cost }).eq('id', currentUser.id);
      
      if (!xpError) {
          console.log("SQ-Market: Wallet balance updated. Generating voucher...");
          const { data, error: redError } = await supabase.from('redemptions').insert([{
              traveler_id: currentUser.id, 
              reward_id: reward.id, 
              redemption_code: code
          }]).select();
          
          if (redError) {
              console.error("SQ-Market: Redemption history write failure.", redError);
              throw redError;
          }

          // Wallet state synchronization for UI
          setCurrentUser({...currentUser, xp: currentUser.xp - reward.xp_cost});
          setRedemptions(prev => [...prev, data[0]]);
          
          console.log("SQ-Market: Redemption Successful. Code generated:", code);
          return code;
      }
      return null;
  };

  // --- 9. ADMIN MODERATION ENGINE ---

  const approveSubmission = async (submissionId) => {
    console.log(`SQ-Admin: Verification starting for Submission ID: ${submissionId}`);
    
    const sub = questProgress.find(p => p.id === submissionId);
    if (!sub) return; 
    const quest = quests.find(q => q.id === sub.quest_id);
    if (!quest) return; 

    try {
        // Step 1: Update Verification Status
        const { error: sErr } = await supabase.from('submissions').update({ status: 'approved' }).eq('id', submissionId);
        if (sErr) throw sErr;
        
        // Step 2: Calculate and award XP securely
        const { data: traveler, error: pErr } = await supabase.from('profiles').select('xp').eq('id', sub.traveler_id).single();
        if (pErr) throw pErr;

        const newXp = (traveler.xp || 0) + quest.xp_value;
        const { error: awardErr } = await supabase.from('profiles').update({ xp: newXp }).eq('id', sub.traveler_id);
        if (awardErr) throw awardErr;

        console.log("SQ-Admin: Points successfully awarded to adventurer.");
        alert("Verification Success! XP rewards have been sent.");
        
        // Refresh oversight data
        fetchSubmissions(currentUser.id, 'Admin'); 
    } catch (e) {
        console.error("SQ-Admin: Oversite engine failure ->", e.message);
        alert("Action failed: " + e.message);
    }
  };

  const rejectSubmission = async (id) => {
      try {
        console.log(`SQ-Admin: Rejecting proof submission: ${id}`);
        const { error } = await supabase.from('submissions').update({ status: 'rejected' }).eq('id', id);
        if (error) throw error;
        
        alert("Submission Rejected. Traveler will see the retry option.");
        fetchSubmissions(currentUser.id, 'Admin');
      } catch (e) { console.error(e); }
  };
  
  const approveNewQuest = async (id) => {
      try {
        console.log(`SQ-Admin: Activating partner quest: ${id}`);
        const { error } = await supabase.from('quests').update({ status: 'active' }).eq('id', id);
        if (error) throw error;
        
        alert("Success! The Quest is now LIVE on the map.");
        fetchQuests();
      } catch (e) { console.error(e); }
  };

  const approveNewReward = async (id) => {
      try {
        console.log(`SQ-Admin: Activating marketplace reward: ${id}`);
        const { error } = await supabase.from('rewards').update({ status: 'active' }).eq('id', id);
        if (error) throw error;
        
        alert("Success! The Reward is now LIVE in the marketplace.");
        fetchRewards();
      } catch (e) { console.error(e); }
  };

  // --- 10. SYSTEM MASTER ROLE OVERRIDE ---
  const switchRole = (role) => {
    if (!currentUser) {
        alert("Authentication required for debug actions.");
        return;
    }

    // MANDATORY SECURITY LOCK: Only the hardcoded master email can perform view manipulation.
    if (currentUser.email !== ADMIN_EMAIL) {
        console.warn("SQ-System: Manual role override attempted by unauthorized account.");
        return; 
    }

    console.log(`SQ-System: System Admin manual switch to context: ${role}`);
    
    // Switch the local context view
    setCurrentUser({ ...currentUser, role: role });
    
    // Immediately refresh data context to match the new role view
    fetchSubmissions(currentUser.id, role);
  };

  // --- RENDER PROVIDER GATEWAY ---
  return (
    <SideQuestContext.Provider value={{
      currentUser, isLoading, 
      users, quests, questProgress, redemptions, rewards,
      showAuthModal, setShowAuthModal,
      login, signup, logout,
      addQuest, updateQuest, deleteQuest, approveNewQuest,
      addReward, updateReward, deleteReward, approveNewReward, 
      acceptQuest, submitProof, approveSubmission, rejectSubmission,
      redeemReward, switchRole, 
      toast 
    }}>
      {children}
    </SideQuestContext.Provider>
  );
};