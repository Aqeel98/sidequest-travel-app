import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import imageCompression from 'browser-image-compression';

/**
 * SideQuestContext: The central nervous system of the platform.
 * Handles Auth, Persistence, Realtime DB Sync, and Gamification.
 * 
 * UPDATED: Fixed for 4G Uploads and Z-Index Layering.
 */
const SideQuestContext = createContext();

export const useSideQuest = () => useContext(SideQuestContext);

export const SideQuestProvider = ({ children }) => {
  // --- 1. GLOBAL SYSTEM STATE ---
  // Core user identity and session persistence
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); 
  const userRef = useRef(null);
  useEffect(() => {
      userRef.current = currentUser;
  }, [currentUser]);

    
  // Ecosystem content pools
  const [quests, setQuests] = useState([]);
  const [rewards, setRewards] = useState([]); 
  const [questProgress, setQuestProgress] = useState([]); 
  const [redemptions, setRedemptions] = useState([]);
  
  // Administrative data pools
  const [users, setUsers] = useState([]); 
  
  // UI State Management
  const [showAuthModal, setShowAuthModal] = useState(false);

  // --- NOTIFICATION SYSTEM (State Only) ---
  // We removed the visual renderer here to prevent "Double Toasts" with App.jsx
  const [toast, setToast] = useState(null); 

  const showToast = (message, type = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 4000); // Auto-hide after 4 seconds
  };
    
  // LOGIC LOCK: THE RACE CONDITION SHIELD
  const isInitialBoot = useRef(true);

  // MASTER SECURITY CONSTANT
  const ADMIN_EMAIL = 'sidequestsrilanka@gmail.com';



  


  // --- 2. THE HARDENED SEQUENTIAL BOOT (Persistence & Guest Logic) ---
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
           await fetchProfile(session.user.id, session.user.email);
           console.log("SQ-Step 4: Profile and user history handshaked successfully.");
        } else {
           console.log("SQ-Step 4: No active session. Transitioning to Silent Guest Mode.");
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

    // --- 3. THE MASTER AUTH LISTENER ---
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      // CRITICAL GUARD: If the boot sequence is currently handshaking, ignore these events.
      if (isInitialBoot.current) {
          console.log("SQ-System: Ignoring background auth event during boot lock:", event);
          return;
      }

      console.log("SQ-System: Post-Boot Auth Event Handshake ->", event);

      if (session) {
          if (!currentUser) {
            console.log("SQ-System: Hydrating local user state from database...");
            await fetchProfile(session.user.id, session.user.email);
          }
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

    // Safety Timer
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
  }, []);

  // --- 4. REALTIME DATA CHANNELS (CDC) ---
  const subscribeToEcosystemChanges = () => {
    return supabase
      .channel('ecosystem-sync')
      
      // QUESTS
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quests' }, (payload) => {
          if (payload.eventType === 'UPDATE') {
              setQuests(prev => prev.map(q => q.id === payload.new.id ? payload.new : q));
              if (payload.new.status === 'active') {
                  showToast(`Quest "${payload.new.title}" is now LIVE!`, 'success');
              }
          } 
          else if (payload.eventType === 'INSERT') {
              setQuests(prev => [...prev, payload.new]);
              if (payload.new.status === 'pending_admin') {
                  showToast("New Partner Quest awaiting approval.", 'info');
              }
          } 
          else if (payload.eventType === 'DELETE') {
              setQuests(prev => prev.filter(q => q.id !== payload.old.id));
          }
      })
      
      // REWARDS
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rewards' }, (payload) => {
          if (payload.eventType === 'UPDATE') {
              setRewards(prev => prev.map(r => r.id === payload.new.id ? payload.new : r));
          } 
          else if (payload.eventType === 'INSERT') {
              setRewards(prev => [...prev, payload.new]);
              if (payload.new.status === 'pending_admin') {
                  showToast("New Partner Reward awaiting approval.", 'info');
              }
          } 
          else if (payload.eventType === 'DELETE') {
              setRewards(prev => prev.filter(r => r.id !== payload.old.id));
          }
      })

      // SUBMISSIONS
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, (payload) => {
        
        const myId = userRef.current?.id;
        const myRole = userRef.current?.role;
        // SECURITY: Only process if it's MY submission or I am ADMIN
        if (myRole !== 'Admin' && payload.new.traveler_id !== myId) return;

        if (payload.eventType === 'INSERT') {
            setQuestProgress(prev => {
                // 1. Check if we already have this EXACT Real ID (Safety check)
                if (prev.find(p => p.id === payload.new.id)) return prev;

                //  2. Check if we have a TEMP version (The Ghost)
                const existingTemp = prev.find(p => 
                    p.quest_id === payload.new.quest_id && 
                    p.traveler_id === payload.new.traveler_id &&
                    p.id.toString().startsWith('temp-')
                );

                if (existingTemp) {
                    // REPLACE the temp row with the real DB row
                    return prev.map(p => p.id === existingTemp.id ? payload.new : p);
                }

                // 3. If no duplicate exists, add it fresh
                return [...prev, payload.new];
            });

            // Notification Logic
            if (payload.new.status === 'in_progress') {
                showToast("Quest Accepted!", 'info');
            }
            if (payload.new.status === 'pending') {
                showToast("New Proof Submitted!", 'info');
            }
        } 
        else if (payload.eventType === 'UPDATE') {
            setQuestProgress(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
            
            if (payload.new.status === 'pending') showToast("Proof Uploaded Successfully!", 'info');
            if (payload.new.status === 'approved') showToast("Quest Approved! XP Awarded", 'success');
            if (payload.new.status === 'rejected') showToast("Proof Rejected. Check My Quests.", 'error');
        }
    })
    .subscribe();
  };

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
      
      // ZOMBIE USER REPAIR
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
          if (data.email === ADMIN_EMAIL) data.role = 'Admin';
          
          setCurrentUser(data);
          subscribeToProfileChanges(userId);
          
          await Promise.all([
             fetchSubmissions(userId, data.role),
             fetchRedemptions(userId)
          ]);
      }
    } catch (err) {
      console.error("SQ-Profile: Critical profile handshake failure.", err);
    }
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

  const fetchQuests = async () => {
    const { data } = await supabase.from('quests').select('*');
    if (data) setQuests(data);
  };

  const fetchRewards = async () => {
    const { data } = await supabase.from('rewards').select('*');
    if (data) setRewards(data);
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
            
            const { data: createdProfile, error: profileError } = await supabase
                .from('profiles')
                .upsert([newProfile])
                .select()
                .single();
            
            if (profileError) throw profileError;

            if (createdProfile) {
                setCurrentUser(createdProfile);
                subscribeToProfileChanges(data.user.id);
                await fetchSubmissions(data.user.id, createdProfile.role);
                console.log("SQ-Auth: Identity Hydration complete.");
            }

            // ✅ UI FIX: Replaced alert with showToast
            showToast(`Welcome to SideQuest, ${name}! Your profile is ready.`, 'success');
        }
    } catch (err) {
        console.error("SQ-Auth: Registration Halted ->", err.message);
        // ✅ UI FIX: Handle errors gracefully with Toast
        showToast(err.message, 'error'); 
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
        console.log("SQ-Quest: Initiating Insert...");

        // 1. Explicit Payload (Safety Shield against NaN and extra fields)
        const cleanPayload = {
            title: formData.title || "Untitled Quest",
            description: formData.description || "",
            category: formData.category || "General",
            xp_value: parseInt(formData.xp_value) || 0,
            location_address: formData.location_address || "",
            lat: parseFloat(formData.lat) || 0,
            lng: parseFloat(formData.lng) || 0,
            instructions: formData.instructions || "",
            proof_requirements: formData.proof_requirements || "",
            image: formData.image || null, // Use URL if Dashboard sent it
            created_by: currentUser.id,
            status: currentUser.role === 'Admin' ? 'active' : 'pending_admin'
        };

        // 2. INSERT & GET ID (Wait for ID confirmation)
        const { data, error: dbErr } = await supabase
            .from('quests')
            .insert([cleanPayload])
            .select('id') 
            .single();

        if (dbErr) throw dbErr;
        console.log("SQ-Quest: Insert successful. ID:", data.id);

        // 3. BACKGROUND IMAGE (Run without await)
        if (imageFile && data.id) {
            const runBgUpload = async () => {
                try {
                    // Optimized for 4G (0.6MB)
                    const options = { maxSizeMB: 0.6, maxWidthOrHeight: 1200, useWebWorker: false };
                    const optimized = await imageCompression(imageFile, options);
                    
                    // FIX: RENAME TO TIMESTAMP (Matches addReward logic for 100% safety)
                    const fname = `quest_${Date.now()}.jpg`;
                    const fileToUpload = new File([optimized], fname, { type: 'image/jpeg' });

                    const { error: upErr } = await supabase.storage.from('quest-images').upload(fname, fileToUpload);
                    if (upErr) throw upErr;
                    
                    const url = supabase.storage.from('quest-images').getPublicUrl(fname).data.publicUrl;

                    // Update the quest record
                    await supabase.from('quests').update({ image: url }).eq('id', data.id);
                    console.log("SQ-Quest: Background Image finished.");
                } catch (e) { console.error("BG Upload Error:", e); }
            };
            runBgUpload();
        }

        showToast("Quest submitted successfully!", 'success');
        return true; // Unlocks Dashboard immediately
    } catch (error) {
        console.error("SQ-Quest Error:", error.message);
        alert("Submission failed: " + error.message);
        return false;
    }
};


const updateQuest = async (id, updates) => {
    try {
        console.log(`SQ-System: Updating Quest ID: ${id}`);
        
        const { id: _id, created_at, created_by, ...payload } = updates;
        
        const finalStatus = currentUser?.role === 'Admin' 
            ? (updates.status || 'active') 
            : 'pending_admin';

        
        const { error } = await supabase.from('quests').update({
            ...payload, 
            xp_value: parseInt(payload.xp_value) || 0, 
            lat: parseFloat(payload.lat) || 0, 
            lng: parseFloat(payload.lng) || 0, 
            status: finalStatus
        }).eq('id', Number(id)); // No .select() here

        if (error) throw error;

        // Sync local state immediately
        setQuests(prev => prev.map(q => q.id === Number(id) ? { ...q, ...payload, status: finalStatus } : q));
        
        showToast("Quest updated successfully.", 'success');
        return true; 
    } catch (error) { 
        console.error("SQ-Quest Update Error:", error.message);
        alert("Update Failed: " + error.message); 
        return false; 
    }
};

  const deleteQuest = async (id) => {
    try {
        console.log(`SQ-Quest: Attempting to remove quest: ${id}`);
        
        // 1. First, wipe the history (Submissions) so the database doesn't complain
        const { error: subError } = await supabase.from('submissions').delete().eq('quest_id', id);
        if (subError) console.warn("SQ-System: Could not clear history", subError);

        // 2. Now delete the Quest itself
        const { error } = await supabase.from('quests').delete().eq('id', id);
        
        if (error) throw error;
        
        setQuests(prev => prev.filter(q => q.id !== id));
        showToast("Quest permanently deleted.", 'info');
    } catch (error) { 
        console.error("SQ-Quest: Deletion error ->", error.message);
        alert("Deletion failed: " + error.message); 
    }
  };
  
  const acceptQuest = async (questId) => {
    if (!currentUser) {
        setShowAuthModal(true);
        return false;
    }
    
    // --- FIX: OPTIMISTIC UI UPDATE (Instant Feedback) ---
    const tempId = `temp-${Date.now()}`;
    const optimisticSub = { id: tempId, quest_id: questId, traveler_id: currentUser.id, status: 'in_progress' };
    setQuestProgress(prev => [...prev, optimisticSub]);

    try {
        console.log(`SQ-Quest: Traveler accepting quest: ${questId}`);
        
        const { data, error } = await supabase.from('submissions').insert([{
            quest_id: questId, 
            traveler_id: currentUser.id, 
            status: 'in_progress'
        }]).select().single();
        
        if (error) throw error;
        
        // Swap temp ID with real ID
        setQuestProgress(prev => prev.map(p => p.id === tempId ? data : p));
        console.log("SQ-Quest: Quest join successful.");
        return true; 
        
    } catch (error) {
        console.error("SQ-Quest: Acceptance error ->", error.message);
        // Rollback state if DB fails
        setQuestProgress(prev => prev.filter(p => p.id !== tempId));
        showToast("Connection failed. Try again.", 'error');
        return false;
    }
  };

  const submitProof = async (questId, note, file) => {
    // 1. GET LOCAL STATE
    let currentProgress = questProgress.find(p => p.quest_id === questId && p.traveler_id === currentUser.id);
    
    // 2. OPTIMISTIC UPDATE (Instant Visual Feedback)
    const optimisticUpdate = { 
        ...currentProgress, 
        status: 'pending', 
        completion_note: note,
        proof_photo_url: file ? URL.createObjectURL(file) : currentProgress?.proof_photo_url,
        submitted_at: new Date().toISOString()
    };
    
    // Update UI immediately
    setQuestProgress(prev => {
        const exists = prev.find(p => p.quest_id === questId);
        if (exists) return prev.map(p => p.quest_id === questId ? optimisticUpdate : p);
        return [...prev, optimisticUpdate];
    });

    // 3. BACKGROUND SYNC (The "Smart Wait" Logic)
    const performSync = async () => {
        try {
            console.log(`SQ-Impact: Starting sync for Quest: ${questId}`);
            
            // STEP A: RESOLVE REAL ID 
            // If the ID is "temp-", we must wait for the DB to give us the Real ID
            let realSubmissionId = currentProgress?.id && !currentProgress.id.toString().startsWith('temp-') 
                ? currentProgress.id 
                : null;

            if (!realSubmissionId) {
                console.log("SQ-System: ID is temporary. Waiting for DB sync...");
                
                // Wait 10 seconds (20 x 500ms) for rural connections
                for (let i = 0; i < 20; i++) {
                    const { data } = await supabase.from('submissions')
                        .select('id')
                        .eq('quest_id', questId)
                        .eq('traveler_id', currentUser.id)
                        .maybeSingle();
                    
                    if (data) {
                        realSubmissionId = data.id;
                        break; // Found it! Exit loop.
                    }
                    await new Promise(r => setTimeout(r, 500)); // Wait 0.5s
                }

                if (!realSubmissionId) {
                    throw new Error("Network sync timeout. Please refresh and try again.");
                }
            }

            // STEP B: UPLOAD FILE (Background)
            let proofUrl = null;
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `proofs/${currentUser.id}_${Date.now()}.${fileExt}`;
                
                const { error: upErr } = await supabase.storage.from('proofs').upload(fileName, file);
                if (upErr) throw upErr;
                
                const { data } = supabase.storage.from('proofs').getPublicUrl(fileName);
                proofUrl = data.publicUrl;
            }

            // STEP C: UPDATE DATABASE
            // Now we update the Real ID with the proof info
            const { error: dbErr } = await supabase.from('submissions').update({
                status: 'pending',
                completion_note: note,
                proof_photo_url: proofUrl || optimisticUpdate.proof_photo_url,
                submitted_at: new Date().toISOString()
            }).eq('id', realSubmissionId);

            if (dbErr) throw dbErr;

            console.log("SQ-Impact: Sync complete. Admin notified.");
            showToast("Proof verified & saved to server!", 'success');

        } catch (err) {
            console.error("SQ-Error:", err);
            showToast(err.message, 'error');
            // On failure, revert the UI to the truth so the user knows to retry
            fetchSubmissions(currentUser.id, 'Traveler');
        }
    };

    // Execute background work (Don't await it, let the UI move on)
    performSync();
    
    return true; // Unblocks the UI immediately
  };
  // // --- 8. REWARD ECONOMY ACTIONS ---

  const addReward = async (formData, imageFile) => {
    try {
        console.log("SQ-Market: Initiating Reward Insert...");

        // 1. Explicit Payload
        const cleanPayload = {
            title: formData.title || "New Reward",
            description: formData.description || "",
            xp_cost: parseInt(formData.xp_cost) || 0,
            image: formData.image || null,
            created_by: currentUser.id,
            status: currentUser.role === 'Admin' ? 'active' : 'pending_admin'
        };

        // 2. Standard Insert
        const { data, error: dbErr } = await supabase
            .from('rewards')
            .insert([cleanPayload])
            .select('id')
            .single();

        if (dbErr) throw dbErr;

        // 3. Background Upload
        if (imageFile && data.id) {
            const runBgReward = async () => {
                try {
                    const options = { maxSizeMB: 0.6, maxWidthOrHeight: 1200, useWebWorker: false };
                    const optimized = await imageCompression(imageFile, options);
                    
                    // TIMESTAMP RENAME
                    const fname = `reward_${Date.now()}.jpg`;
                    const fileToUpload = new File([optimized], fname, { type: 'image/jpeg' });
                    
                    const { error: upErr } = await supabase.storage.from('quest-images').upload(fname, fileToUpload);
                    if (upErr) throw upErr;

                    const url = supabase.storage.from('quest-images').getPublicUrl(fname).data.publicUrl;
                    
                    await supabase.from('rewards').update({ image: url }).eq('id', data.id);
                    console.log("SQ-Market: Background Image finished.");
                } catch (e) { console.error(e); }
            };
            runBgReward();
        }

        showToast("Reward submitted!", 'success');
        return true;
    } catch (error) {
        console.error("SQ-Reward Error:", error.message);
        alert("Submission failed: " + error.message);
        return false;
    }
};


  const updateReward = async (id, updates) => {
    try {
        console.log(`SQ-Market: Hardening Update Logic for Reward ID: ${id}`);
        
        // 1. Clean payload
        const { id: _id, created_at, created_by, ...payload } = updates;
        
        // 2. STATUS LOGIC: 
        // If Admin: Respect the choice. If Partner: Force re-verification.
        const finalStatus = currentUser?.role === 'Admin' 
            ? (updates.status || 'active') 
            : 'pending_admin';
        
        const { error } = await supabase.from('rewards').update({ 
          ...payload, 
          xp_cost: parseInt(payload.xp_cost) || 0, // ✅ FIX 4: Sanitization
          status: finalStatus 
        }).eq('id', Number(id));
        
        if (error) throw error;
        
        // 3. Sync local state for instant feedback
        setRewards(prev => prev.map(r => r.id === Number(id) ? { ...r, ...payload, status: finalStatus } : r));
        
        console.log("SQ-Market: Reward update confirmed.");
        showToast("Reward updated.", 'success');
        return true; // ✅ Unblocks Dashboard
    } catch (error) { 
        console.error("SQ-Market: Update failure ->", error.message);
        alert("Update failed: " + error.message); 
        return false;
    }
};

  const deleteReward = async (id) => {
    try {
      console.log(`SQ-Market: Deleting reward: ${id}`);
      
      // 1. First, wipe the redemption history
      const { error: redError } = await supabase.from('redemptions').delete().eq('reward_id', id);
      if (redError) console.warn("SQ-System: Could not clear redemptions", redError);

      // 2. Now delete the Reward
      const { error } = await supabase.from('rewards').delete().eq('id', id);
      
      if (error) throw error;
      
      setRewards(prev => prev.filter(r => r.id !== id));
      showToast("Reward permanently deleted.", 'info');
    } catch (error) { 
      console.error("SQ-Market: Deletion error ->", error.message);
      alert("Deletion failed: " + error.message); 
    }
};

  const redeemReward = async (reward) => {
      console.log(`SQ-Market: Traveler initiating redemption for: ${reward.title}`);
      
      if (currentUser.xp < reward.xp_cost) {
          console.warn("SQ-Market: Insufficient traveler balance.");
          showToast("Insufficient XP!", 'error');
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

          setCurrentUser({...currentUser, xp: currentUser.xp - reward.xp_cost});
          setRedemptions(prev => [...prev, data[0]]);
          
          console.log("SQ-Market: Redemption Successful. Code generated:", code);
          return code;
      }
      return null;
  };

  // --- 9. ADMIN MODERATION ENGINE ---

  const approveSubmission = async (submissionId) => {
    // 1. OPTIMISTIC UPDATE: Update UI instantly (don't wait for DB)
    setQuestProgress(prev => prev.map(p => 
        p.id === submissionId ? { ...p, status: 'approved' } : p
    ));

    // 2. Logic & DB Call
    const sub = questProgress.find(p => p.id === submissionId);
    if (!sub) return; 
    const quest = quests.find(q => q.id === sub.quest_id);
    
    try {
        const { error: sErr } = await supabase.from('submissions').update({ status: 'approved' }).eq('id', submissionId);
        if (sErr) throw sErr;
        
        // Award XP
        const { data: traveler } = await supabase.from('profiles').select('xp').eq('id', sub.traveler_id).single();
        if (traveler && quest) {
            await supabase.from('profiles').update({ xp: (traveler.xp || 0) + quest.xp_value }).eq('id', sub.traveler_id);
        }

        showToast("Verified! XP Awarded.", 'success');
        
    } catch (e) {
        console.error("SQ-Admin Error:", e);
        showToast("Error: " + e.message, 'error');
        // Revert UI if failed
        fetchSubmissions(currentUser.id, 'Admin');
    }
  };

  const rejectSubmission = async (id) => {
    // 1. OPTIMISTIC UPDATE
    setQuestProgress(prev => prev.map(p => 
        p.id === id ? { ...p, status: 'rejected' } : p
    ));

    try {
      const { error } = await supabase.from('submissions').update({ status: 'rejected' }).eq('id', id);
      if (error) throw error;
      
      showToast("Submission Rejected.", 'info');
    } catch (e) { 
        console.error(e);
        fetchSubmissions(currentUser.id, 'Admin'); // Revert on error
    }
};
  
const approveNewQuest = async (id) => {
    // 1. OPTIMISTIC UPDATE
    setQuests(prev => prev.map(q => 
        q.id === id ? { ...q, status: 'active' } : q
    ));

    try {
      const { error } = await supabase.from('quests').update({ status: 'active' }).eq('id', id);
      if (error) throw error;
      
      showToast("Quest is now LIVE on map.", 'success');
    } catch (e) { 
        console.error(e);
        fetchQuests(); // Revert
    }
};

const approveNewReward = async (id) => {
    // 1. OPTIMISTIC UPDATE
    setRewards(prev => prev.map(r => 
        r.id === id ? { ...r, status: 'active' } : r
    ));

    try {
      const { error } = await supabase.from('rewards').update({ status: 'active' }).eq('id', id);
      if (error) throw error;
      
      showToast("Reward is now LIVE in market.", 'success');
    } catch (e) { 
        console.error(e);
        fetchRewards(); // Revert
    }
};

  // --- 10. SYSTEM MASTER ROLE OVERRIDE ---
  const switchRole = (role) => {
    if (!currentUser) {
        alert("Authentication required for debug actions.");
        return;
    }

    if (currentUser.email !== ADMIN_EMAIL) {
        console.warn("SQ-System: Manual role override attempted by unauthorized account.");
        return; 
    }

    console.log(`SQ-System: System Admin manual switch to context: ${role}`);
    
    // Switch the local context view
    setCurrentUser({ ...currentUser, role: role });
    
    // Immediately refresh data context to match the new role view
    fetchSubmissions(currentUser.id, role);
    showToast(`Debug: Switched to ${role}`, 'info');
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
      toast, showToast
    }}>
      {children}
    </SideQuestContext.Provider>
  );
};