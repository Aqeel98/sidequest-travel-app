import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';


/**
 * SideQuestContext: The central nervous system of the platform.
 * Handles Auth, Persistence, Realtime DB Sync, and Gamification.
 * 
 * UPDATED: Fixed for 4G Uploads and Z-Index Layering.
 */
const SideQuestContext = createContext();

export const useSideQuest = () => useContext(SideQuestContext);

const withTimeout = (promise, ms) => {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Connection Timeout")), ms))
    ]);
};




export const SideQuestProvider = ({ children }) => {
  // --- 1. GLOBAL SYSTEM STATE ---
  // Core user identity and session persistence
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); 
  const userRef = useRef(null);
  const activeUploads = useRef(0); 

  useEffect(() => {
      userRef.current = currentUser;
  }, [currentUser]);

    
  // Ecosystem content pools
  const [quests, setQuests] = useState([]);
  const [rewards, setRewards] = useState([]); 
  const [quizBank, setQuizBank] = useState([]); 
  const [completedQuizIds, setCompletedQuizIds] = useState([]); 
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

  // --- 1.5 PWA AUTO-RECONNECT LOGIC ---
  
  // A. Helper to refresh data when app wakes up
  const refreshFullState = async (userId, role) => {
    try {
        console.log("SQ-PWA: Waking up & refreshing data...");
        
        // Refresh Global Data
        const { data: qData } = await supabase.from('quests').select('*');
        if (qData) setQuests(qData);
        const { data: rData } = await supabase.from('rewards').select('*');
        if (rData) setRewards(rData);
        const { data: quizData } = await supabase.from('view_quiz_public').select('*');
        if (quizData) setQuizBank(quizData);
        // Refresh User Data
        if (role === 'Admin') {
            const { data: subs } = await supabase.from('submissions').select('*');
            if (subs) setQuestProgress(subs);
        } else {
            const { data: mySubs } = await supabase.from('submissions').select('*').eq('traveler_id', userId);
            if (mySubs) setQuestProgress(mySubs);
            
            await fetchQuizHistory(userId);

            let redQuery = supabase
            .from('redemptions')
            .select('*, profiles(full_name), rewards(created_by, title)');

        if (role === 'Traveler') {

            redQuery = redQuery.eq('traveler_id', userId);
        } 
        else if (role === 'Partner') {

            redQuery = redQuery.eq('rewards.created_by', userId);
        }
        const { data: redData } = await redQuery;
        if (redData) setRedemptions(redData);


        }
        console.log("SQ-PWA: Data synced.");
    } catch (e) { console.warn("SQ-PWA: Background refresh failed", e); }
};

// B. Listener for App Visibility AND Network Recovery
useEffect(() => {
    // Helper: What to do when the app wakes up
    const handleWakeUp = async () => {
        if (userRef.current) {
            // 1. Wake up Auth (in case token expired)
            try { await withTimeout(supabase.auth.getSession(), 2000); } catch(e){}
            
            // 2. FORCE REALTIME RECONNECT (The Socket Jumper)
            supabase.realtime.connect(); 

            // 3. Refresh Data
            await refreshFullState(userRef.current.id, userRef.current.role);
        }
    };

    // Trigger 1: User switches tabs back to SideQuest
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') handleWakeUp();
    };

    // Trigger 2: User regains internet (e.g. coming out of tunnel)
    const handleOnline = () => {
        console.log("SQ-Network: Signal restored. Reconnecting...");
        handleWakeUp();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);

    return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        window.removeEventListener("online", handleOnline);
    };
  }, []);



  const fetchQuizHistory = async (userId) => {
    const { data } = await supabase.from('quiz_completions').select('question_id').eq('user_id', userId);
    if (data) setCompletedQuizIds(data.map(item => item.question_id));
  };


  const recoverPendingSyncs = async (userId) => {
    const buffer = JSON.parse(localStorage.getItem('sq_pending_quiz') || '[]');
    if (buffer.length === 0) return;

    console.log(`SQ-Vault: Recovering ${buffer.length} unsynced items...`);

    for (const item of buffer) {
        try {
            const { error } = await supabase.rpc('submit_quiz_answer', {
                question_id_input: item.questionId,
                selected_index: item.selectedIndex
            });
            if (!error || error.message.includes('already claimed')) {
                const currentBuffer = JSON.parse(localStorage.getItem('sq_pending_quiz') || '[]');
                const filtered = currentBuffer.filter(i => i.questionId !== item.questionId);
                localStorage.setItem('sq_pending_quiz', JSON.stringify(filtered));
            }
        } catch (e) { break; } 
    }
    fetchQuizHistory(userId);
  };

  useEffect(() => {
    if (!isLoading && currentUser?.id) {
        recoverPendingSyncs(currentUser.id);
    }
  }, [isLoading, currentUser?.id]);

  const submitQuizAnswer = async (questionId, selectedIndex, xpAmount, isCorrect) => { 
    if (!currentUser) { 
        setShowAuthModal(true); 
        return; 
    }

    // 1. INSTANT LOCAL UI UPDATE
    setCompletedQuizIds(prev => [...prev, questionId]);
    if (isCorrect) {
        setCurrentUser(prev => ({ ...prev, xp: prev.xp + xpAmount }));
    }

    // 2. SAVE TO PERSISTENCE BUFFER (Resilience for Reloads/Offline)
    const pendingSyncs = JSON.parse(localStorage.getItem('sq_pending_quiz') || '[]');
    pendingSyncs.push({ questionId, selectedIndex, xpAmount, isCorrect });
    localStorage.setItem('sq_pending_quiz', JSON.stringify(pendingSyncs));

    const performRobustSync = async () => {
        try {
            try { 
                await withTimeout(supabase.auth.getSession(), 2000); 
            } catch(e) { 
                supabase.realtime.connect(); 
            }

            const { data: result, error } = await withTimeout(
                supabase.rpc('submit_quiz_answer', {
                    question_id_input: questionId,
                    selected_index: selectedIndex
                }), 12000
            );

            if (error && !error.message.includes('already claimed')) throw error;

            // SUCCESS: Remove from local buffer
            const currentBuffer = JSON.parse(localStorage.getItem('sq_pending_quiz') || '[]');
            const filtered = currentBuffer.filter(i => i.questionId !== questionId);
            localStorage.setItem('sq_pending_quiz', JSON.stringify(filtered));

        } catch (err) {
            const { data: verify } = await supabase
                .from('quiz_completions')
                .select('id')
                .eq('user_id', currentUser.id)
                .eq('question_id', questionId)
                .maybeSingle();

            if (verify) {
                // Even if the RPC failed, the data is on the server. Clear the buffer.
                const currentBuffer = JSON.parse(localStorage.getItem('sq_pending_quiz') || '[]');
                const filtered = currentBuffer.filter(i => i.questionId !== questionId);
                localStorage.setItem('sq_pending_quiz', JSON.stringify(filtered));
            } else {
                // Truly failed/Offline: Keep in buffer. recoveryEngine will handle it.
                console.warn("SQ-Vault: Sync postponed. Result stored in device memory.");
            }
        }
    };

    performRobustSync();
};


  // --- 2. THE HARDENED SEQUENTIAL BOOT (Persistence & Guest Logic) ---
  useEffect(() => {
    let mounted = true;
    

    
    // NOTE: Realtime subscription removed from here. 
        const bootSequence = async () => {
          try {
            console.log("SQ-Step 1: Initiating Hardened Parallel Boot...");
            if (mounted) setIsLoading(true);
        
            // 1. FIRE ALL PUBLIC & AUTH CHECKS AT ONCE
            const questPromise = supabase.from('quests').select('*');
            const rewardPromise = supabase.from('rewards').select('*');
            const quizPromise = supabase.from('view_quiz_public').select('*');
            const sessionPromise = supabase.auth.getSession();
        
            // 2. WAIT FOR ALL THREE TO ARRIVE
            const [qRes, rRes, quizRes, sRes] = await Promise.all([
                questPromise, 
                rewardPromise, 
                quizPromise, 
                sessionPromise
            ]);
        
            if (mounted) {
                setQuests(qRes.data || []);
                setRewards(rRes.data || []);
                setQuizBank(quizRes.data || []);

                const session = sRes.data?.session;
        
                if (session) {
                    console.log("SQ-Step 2: Session found, hydrating profile...");
                    await fetchProfile(session.user.id, session.user.email);
                } else {
                    console.log("SQ-Step 2: No session. Guest mode active.");
                    setShowAuthModal(false);
                }
            }
          } catch (error) {
            console.error("SQ-Boot-Failure:", error.message);
          } finally {
            if (mounted) {
                isInitialBoot.current = false; 
                setIsLoading(false);
                console.log("SQ-Step 3: UI Released.");
            }
          }
        };

    bootSequence();

    // --- 3. THE MASTER AUTH LISTENER ---
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      if (isInitialBoot.current) return;

      if (event === 'MFA_CHALLENGE_VERIFIED') {
      console.log("SQ-System: MFA Verified event detected. Handing control to Admin UI.");
      return; 
     }

      console.log("SQ-System: Post-Boot Auth Event Handshake ->", event);

      if (session) {
          if (!currentUser) {
            console.log("SQ-System: Hydrating local user state from database...");
            await fetchProfile(session.user.id, session.user.email);
          }
        //  setShowAuthModal(false); 
      } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        console.log("SQ-System: Authentication purged. Cleaning all local data pools.");
        setCurrentUser(null);
        setQuestProgress([]);
        setRedemptions([]);
        setCompletedQuizIds([]); 
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
      // NOTE: Removed ecosystemSync.unsubscribe() here
      subscription.unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, []);

  // --- NEW: Realtime Connection Fix (Reconnects when User/Role changes) ---
  useEffect(() => {
    if (isLoading) return; 

    // This calls your existing function, but connects with the CORRECT permissions
    const channel = subscribeToEcosystemChanges();

    return () => {
        if (channel) supabase.removeChannel(channel);
    };
  }, [currentUser?.id, isLoading]);


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
              setQuests(prev => {
                  // ✅ FIX: Check if ID exists. If yes, ignore it.
                  if (prev.find(q => q.id === payload.new.id)) return prev;
                  return [...prev, payload.new];
              });

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
              setRewards(prev => {
                  if (prev.find(r => r.id === payload.new.id)) return prev;
                  return [...prev, payload.new];
              });

              if (payload.new.status === 'pending_admin') {
                  showToast("New Partner Reward awaiting approval.", 'info');
              }
          } 
          else if (payload.eventType === 'DELETE') {
              setRewards(prev => prev.filter(r => r.id !== payload.old.id));
          }
      })

      // SUBMISSIONS (FIXED: Reliable Toasts & Instant UI for Travelers)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, (payload) => {
        
        const myId = userRef.current?.id;
        const myRole = userRef.current?.role;
        
        // SECURITY: Only process if it's MY submission or I am ADMIN
        if (myRole !== 'Admin' && payload.new.traveler_id !== myId) return;

        if (payload.eventType === 'INSERT') {
            setQuestProgress(prev => {
                if (prev.find(p => Number(p.id) === Number(payload.new.id))) return prev;

                const existingTemp = prev.find(p => 
                    p.quest_id == payload.new.quest_id && 
                    p.traveler_id == payload.new.traveler_id &&
                    p.id?.toString().startsWith('temp-')
                );

                if (existingTemp) {
                    return prev.map(p => p.id === existingTemp.id ? payload.new : p);
                }
                return [...prev, payload.new];
            });

            // Trigger Toasts based on who is looking
            if (payload.new.status === 'in_progress') showToast("Quest Accepted!", 'info');
            if (payload.new.status === 'pending') showToast("New Proof Submitted!", 'info');
        } 
        else if (payload.eventType === 'UPDATE') {
            // STEP 1: Update the state once and only once
            setQuestProgress(prev => prev.map(p => p.id == payload.new.id ? { ...p, ...payload.new } : p));
            
            // STEP 2: Only show status toasts to the Traveler who owns the quest
            if (payload.new.traveler_id === myId) {
                if (payload.new.status === 'pending') showToast("Proof Uploaded Successfully!", 'info');
                if (payload.new.status === 'approved') showToast("Quest Approved! XP Awarded ⭐", 'success');
                if (payload.new.status === 'rejected') showToast("Proof Rejected. Check My Quests.", 'error');
            }
        }
    })

    // REDEMPTIONS (FIXED: Instant Green-to-Gray and instant Toast)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'redemptions' }, async (payload) => {
        const myId = userRef.current?.id;
        if (!myId) return;

        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
    
            setRedemptions(prev => {
                const exists = prev.find(r => r.id == payload.new.id);
                if (exists) {
                    return prev.map(r => r.id == payload.new.id ? { ...r, ...payload.new } : r);
                }
                return [...prev, payload.new];
            });
        
            if (payload.new.status === 'verified' && payload.new.traveler_id === myId) {
                showToast(`Voucher verified and used!`, 'success');
            }

            // STEP 3: HYDRATE IN BACKGROUND (Does not block the UI update)
            try {
                const { data: hydrated, error } = await supabase
                    .from('redemptions')
                    .select('*, profiles(full_name), rewards(title, created_by)')
                    .eq('id', payload.new.id)
                    .maybeSingle();
                
                if (hydrated && !error) {
                    setRedemptions(prev => prev.map(r => r.id == hydrated.id ? hydrated : r));
                }
            } catch (e) {
                console.warn("SQ-Realtime: Background hydration failed", e);
            }
        } 
        else if (payload.eventType === 'DELETE') {
            setRedemptions(prev => prev.filter(r => r.id !== payload.old.id));
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
  // --- 5. DATA SYNC & ZOMBIE REPAIR LOGIC ---
const fetchProfile = async (userId, userEmail) => {
    try {
      console.log("SQ-Profile: Initiating database handshake for:", userEmail);
      
      // 1. Fetch from Public Profiles Table
      let { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      
      // 2. Fetch from Auth (This contains the MFA factors for the Admin)
      const { data: { user: authUser } } = await supabase.auth.getUser();
  
      // 3. ZOMBIE USER REPAIR (Keep your existing logic)
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
          }
      }
  
      if (data) {
          if (data.email === ADMIN_EMAIL) data.role = 'Admin';
          
          // 4. THE FIX: Merge DB data with Auth factors
          // Normal users will just have an empty array for factors
          const mergedUser = {
              ...data,
              factors: authUser?.factors || [],
              app_metadata: authUser?.app_metadata || {},
              user_metadata: authUser?.user_metadata || {}
          };
  
          setCurrentUser(mergedUser); // State now includes MFA info
          subscribeToProfileChanges(userId);
          
          // 5. Trigger background data syncs
          await Promise.all([
             fetchSubmissions(userId, data.role),
             fetchRedemptions(userId, data.role),
             fetchQuests(), 
             fetchRewards(),
             fetchQuizHistory(userId)
          ]);
      }
    } catch (err) {
      console.error("SQ-Profile: Critical profile handshake failure.", err);
    }
  };

  const fetchRedemptions = async (userId, role) => {
    try {
        // We join 'profiles' to get the name, and 'rewards' to check the owner
        let query = supabase
            .from('redemptions')
            .select('*, profiles(full_name), rewards!inner(created_by)');

        if (role === 'Traveler') {
            query = query.eq('traveler_id', userId);
        } 
        else if (role === 'Partner') {
            // SECURITY: Only fetch redemptions for rewards THIS partner created
            query = query.eq('rewards.created_by', userId);
        }
        // Admins see everything (no filter)

        const { data, error } = await query;
        if (!error) setRedemptions(data || []);
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

  const optimizeImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Max dimensions (Safe for mobile memory)
          const MAX_WIDTH = 1080;
          const MAX_HEIGHT = 1080;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG 0.7 (Reduces 5MB PNG -> ~200KB JPG)
          canvas.toBlob((blob) => {
            if (!blob) {
                // Fallback if canvas fails
                resolve(file); 
                return;
            }
            const safeName = `img_${Date.now()}.jpg`;
            const optimizedFile = new File([blob], safeName, { type: 'image/jpeg' });
            resolve(optimizedFile);
          }, 'image/jpeg', 0.7);
        };
        img.onerror = (err) => resolve(file); // Fallback to original on error
      };
      reader.onerror = (err) => resolve(file);
    });
  };

  const addQuest = async (formData, imageFile) => {
    try {
        console.log("SQ-System: Processing upload on fresh connection...");
        
        let finalImageUrl = null;
        if (imageFile) {
            // Step A: Setup name
            const cleanFileName = `quest_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
            
            // Step B: Upload (Connection is fresh, so no pulses needed)
            const { error: upErr } = await supabase.storage
                .from('quest-images')
                .upload(cleanFileName, imageFile, { cacheControl: '3600', upsert: true });
            
            if (upErr) throw new Error("Image Upload Failed: " + upErr.message);
            
            const { data } = supabase.storage.from('quest-images').getPublicUrl(cleanFileName);
            finalImageUrl = data.publicUrl;
        }

        // SMART STATUS: Force pending if coords are 0 (missing), even for Admin
        const hasCoords = parseFloat(formData.lat) !== 0 && parseFloat(formData.lng) !== 0;
        const finalStatus = (currentUser.role === 'Admin' && hasCoords) ? 'active' : 'pending_admin';

        const cleanPayload = {
            title: formData.title || "Untitled",
            description: formData.description || "",
            category: formData.category || "General",
            xp_value: parseInt(formData.xp_value) || 0,
            location_address: formData.location_address || "",
            lat: parseFloat(formData.lat) || 0,
            lng: parseFloat(formData.lng) || 0,
            map_link: formData.map_link || "",
            instructions: formData.instructions || "",
            proof_requirements: formData.proof_requirements || "",
            image: finalImageUrl,
            created_by: currentUser.id,
            status: finalStatus
        };

        const { data: quest, error } = await supabase.from('quests').insert([cleanPayload]).select().single();
        if (error) throw error;

        setQuests(prev => [...prev, quest]);
        return true;

    } catch (error) {
        console.error("SQ-Error:", error);
        showToast("Publication failed. Please try again.", 'error');
        return false;
    }
};


// --- ROBUST UPDATE QUEST (Extended Timeout) ---
const updateQuest = async (id, updates) => {
    try {
        console.log(`SQ-System: Updating Quest ID: ${id}...`);
        
        // 1. DATA PREP (Keep exact logic)
        const { 
            title, description, category, xp_value, 
            location_address, lat, lng, instructions, 
            proof_requirements, image, status 
        } = updates;
        
        const finalStatus = currentUser?.role === 'Admin' 
            ? (status || 'active') 
            : 'pending_admin';

        const cleanPayload = {
            title, description, category,
            xp_value: parseInt(xp_value) || 0,
            location_address,
            lat: parseFloat(lat) || 0,
            lng: parseFloat(lng) || 0,
            instructions, proof_requirements, image,
            status: finalStatus
        };

        // 2. DEFINE THE SAVE OPERATION
        const executeSave = () => supabase.from('quests').update(cleanPayload).eq('id', Number(id));

        // 3. EXECUTE WITH RETRY
        try {
            // Attempt 1: Fast check (5 seconds). 
            // If connection is "Zombie", this fails quickly to wake it up.
            const { error } = await withTimeout(executeSave(), 5000);
            if (error) throw error;
        } catch (firstErr) {
            console.warn("SQ-Update: Connection dormant. Retrying immediately...");
            
            // Attempt 2: The Real Save (20 seconds).
            // Connection is now awake, so this will succeed.
            const { error: secondErr } = await withTimeout(executeSave(), 20000);
            if (secondErr) throw secondErr;
        }

        // 4. UI UPDATE
        setQuests(prev => prev.map(q => q.id === Number(id) ? { ...q, ...cleanPayload } : q));
        
        showToast("Quest saved successfully!", 'success');
        return true; 

    } catch (error) { 
        console.error("SQ-Quest Update Error:", error);
        showToast("Save failed: " + (error.message === "Connection Timeout" ? "Network unstable. Please click Save again." : error.message), 'error');
        return false; 
    }
  };

const deleteQuest = async (id) => {
    try {
        console.log(`SQ-Quest: Initiating Optimistic Deletion for: ${id}`);
        
        // Step 1: UI UPDATE INSTANTLY (The "No Hiccup" part)
        // This makes the quest disappear from the list in 0.01 seconds
        setQuests(prev => prev.filter(q => q.id !== id));

        // Step 2: BACKGROUND SYNC
        // We do the heavy database cleanup in the background
        const performBackgroundDelete = async () => {
            try {
                // First, wipe the history so the database constraint doesn't block us
                await supabase.from('submissions').delete().eq('quest_id', id);
                
                // Now delete the Quest itself
                const { error } = await supabase.from('quests').delete().eq('id', id);
                
                if (error) throw error;
                showToast("Quest permanently removed.", 'info');
            } catch (err) {
                console.error("SQ-Delete-Error:", err.message);
                // If it fails, we re-fetch to bring the item back to the UI
                fetchQuests();
                showToast("Delete failed. Re-syncing...", 'error');
            }
        };

        performBackgroundDelete();

        // Step 3: RETURN IMMEDIATELY
        return true; 
    } catch (error) { 
        console.error("SQ-Quest: Deletion process failed ->", error.message);
        return false;
    }
};

  
  const acceptQuest = async (questId) => {
    if (!currentUser) {
        setShowAuthModal(true);
        return false;
    }
    
    // OPTIMISTIC UI UPDATE (Instant Feedback) ---
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
        showToast("Quest Accepted!", 'success');
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
    

    // 2. Lock Browser
    activeUploads.current++;

    let currentProgress = questProgress.find(p => p.quest_id === questId && p.traveler_id === currentUser.id);
    
    // 3. Optimistic Update
    const optimisticUpdate = { 
        ...currentProgress, 
        id: currentProgress?.id || `temp-sync-${Date.now()}`, 
        status: 'pending', 
        completion_note: note,
        proof_photo_url: file ? URL.createObjectURL(file) : currentProgress?.proof_photo_url,
        submitted_at: new Date().toISOString(),
        quest_id: questId,
        traveler_id: currentUser.id
    };
    
    setQuestProgress(prev => {
        const exists = prev.find(p => p.quest_id === questId && p.traveler_id === currentUser.id);
        if (exists) return prev.map(p => (p.quest_id === questId && p.traveler_id === currentUser.id) ? optimisticUpdate : p);
        return [...prev, optimisticUpdate];
    });

    const performSync = async () => {
        try {
            console.log(`SQ-Impact: Starting sync for Quest: ${questId}`);
            
            // STEP A: Try to find the Real ID
            let realSubmissionId = currentProgress?.id && !currentProgress?.id?.toString().startsWith('temp-')
                ? currentProgress.id 
                : null;

            if (!realSubmissionId) {
                console.log("SQ-System: ID is temporary. Looking for DB record...");
                
                // Wait loop (Shortened to 5 seconds. We don't need to wait long.)
                for (let i = 0; i < 10; i++) {
                    const { data } = await supabase.from('submissions')
                        .select('id')
                        .eq('quest_id', questId)
                        .eq('traveler_id', currentUser.id)
                        .maybeSingle();
                    
                    if (data) {
                        realSubmissionId = data.id;
                        break; 
                    }
                    await new Promise(r => setTimeout(r, 500)); 
                }
            }

            // STEP B: Upload File
            let proofUrl = null;
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `proofs/${currentUser.id}_${Date.now()}.${fileExt}`;
                
                console.log("SQ-System: Syncing photo to storage...");

                // --- ADD TIMEOUT SHIELD HERE ---
                const uploadPromise = supabase.storage.from('proofs').upload(fileName, file);
                const { error: upErr } = await withTimeout(uploadPromise, 45000); // 45s for photos
                
                if (upErr) throw upErr;
                const { data } = supabase.storage.from('proofs').getPublicUrl(fileName);
                proofUrl = data.publicUrl;
            }

            // STEP C: UPDATE OR INSERT (The Self-Healing Logic)
            const payload = {
                status: 'pending',
                completion_note: note,
                proof_photo_url: proofUrl || optimisticUpdate.proof_photo_url,
                submitted_at: new Date().toISOString()
            };

            if (realSubmissionId) {
                // Scenario 1: Normal. The quest exists, we update it.
                console.log("SQ-System: Updating existing record.");
                const { error } = await supabase.from('submissions').update(payload).eq('id', realSubmissionId);
                if (error) throw error;
            } else {
                // Scenario 2: The "Ghost" Fix. 
                // The 'Accept' failed, so we create the submission from scratch right now.
                console.log("SQ-System: Original 'Accept' missing. Creating new record (Self-Healing).");
                const { error } = await supabase.from('submissions').insert([{
                    ...payload,
                    quest_id: questId,
                    traveler_id: currentUser.id
                }]);
                if (error) throw error;
            }

            console.log("SQ-Impact: Sync complete.");
            showToast("Proof verified & saved to server!", 'success');

        } catch (err) {
            console.error("SQ-Error:", err);
            showToast(err.message, 'error');
            fetchSubmissions(currentUser.id, 'Traveler');
        } finally {
            activeUploads.current--;
        }
    };

    performSync();
    return true; 
  };


 // --- 8. REWARD ECONOMY ACTIONS ---

  const addReward = async (formData, imageFile) => {
    try {
        console.log("SQ-Reward: 1. Initiating Robust Upload...");
        
        // 🔥 THE FIX: CONNECTION CHECK WITH TIMEOUT
        try {
            await withTimeout(supabase.auth.getSession(), 3000);
        } catch (err) {
            console.warn("SQ-Reward: Connection check timed out. Proceeding.");
        }

        let finalImageUrl = null;
        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const cleanFileName = `reward_${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
            
            let fileToUpload = imageFile;
            try { fileToUpload = await optimizeImage(imageFile); } catch (e) { console.warn("Optimization skipped"); }
            
            const { error: upErr } = await supabase.storage
                .from('quest-images')
                .upload(cleanFileName, fileToUpload, { upsert: true });
            
            if (upErr) throw new Error("Image Upload Failed: " + upErr.message);
            const { data: urlData } = supabase.storage.from('quest-images').getPublicUrl(cleanFileName);
            finalImageUrl = urlData.publicUrl;
        }
        
        const cleanPayload = {
            title: formData.title, 
            description: formData.description,
            map_link: formData.map_link || "",
            xp_cost: parseInt(formData.xp_cost) || 0, 
            image: finalImageUrl,
            created_by: currentUser.id, 
            status: currentUser.role === 'Admin' ? 'active' : 'pending_admin'
        };

        const { data, error } = await supabase.from('rewards').insert([cleanPayload]).select().single();
        if (error) throw error;

        setRewards(prev => { if (prev.find(r => r.id === data.id)) return prev; return [...prev, data]; });
        showToast("Reward submitted!", 'success');
        return true;
    } catch (e) { 
        console.error("SQ-Error:", e);
        showToast("Upload failed: " + e.message, 'error');
        return false; 
    }
  };

// --- ROBUST UPDATE REWARD (Fixed for "Nothing Happens" Hang) ---
const updateReward = async (id, updates) => {
    try {
        console.log(`SQ-Market: Accurate Linear Update for Reward ID: ${id}`);
        
        // 1. DATA SHIELD: Pick ONLY Reward columns
        const { title, description, xp_cost, image, status } = updates;
        
        // 2. STATUS LOGIC:
       
        const finalStatus = currentUser?.role === 'Admin' 
            ? (status || 'active') 
            : 'pending_admin';
        
        const cleanPayload = {
            title,
            description,
            map_link: updates.map_link || "",
            image,
            xp_cost: parseInt(xp_cost) || 0,
            status: finalStatus 
        };

        
        // If the internet is "Zombie", this kills the wait after 25s.
        const updatePromise = supabase
            .from('rewards')
            .update(cleanPayload)
            .eq('id', Number(id));

        const { error } = await withTimeout(updatePromise, 25000);

        if (error) throw error;

        // 4. UI UPDATE
        setRewards(prev => prev.map(r => r.id === Number(id) ? { ...r, ...cleanPayload } : r));
        
        showToast("Reward saved successfully!", 'success');
        return true; 

    } catch (error) { 
        console.error("SQ-Market Update Error:", error);
        showToast("Save failed: " + (error.message || "Network Error. Try again."), 'error');
        return false;
    }
};

const deleteReward = async (id) => {
    try {
        console.log(`SQ-Market: Initiating Optimistic Deletion for: ${id}`);
        
        // Step 1: UI UPDATE INSTANTLY
        setRewards(prev => prev.filter(r => r.id !== id));

        // Step 2: BACKGROUND SYNC
        const performBackgroundDelete = async () => {
            try {
                // Wipe redemption history first
                await supabase.from('redemptions').delete().eq('reward_id', id);
                
                // Delete the Reward
                const { error } = await supabase.from('rewards').delete().eq('id', id);
                
                if (error) throw error;
                showToast("Reward permanently removed.", 'info');
            } catch (err) {
                console.error("SQ-Delete-Error:", err.message);
                fetchRewards();
                showToast("Delete failed.", 'error');
            }
        };

        performBackgroundDelete();

        return true; 
    } catch (error) { 
        console.error("SQ-Market: Deletion process failed ->", error.message);
        return false;
    }
};

const redeemReward = async (reward) => {
    console.log(`SQ-Market: Traveler initiating atomic redemption for: ${reward.title}`);
    
    // 1. FAST CLIENT-SIDE GUARD (Instant feedback before hitting network)
    if (currentUser.xp < reward.xp_cost) {
        console.warn("SQ-Market: Insufficient traveler balance detected locally.");
        showToast("Insufficient XP!", 'error');
        return null;
    }
    
    try {
        console.log("SQ-Market: Executing single-trip atomic transaction...");

        // 2. THE ATOMIC RPC CALL
        const { data: code, error: rpcError } = await supabase.rpc('redeem_reward', {
            reward_id_input: reward.id,
            reward_cost: reward.xp_cost
        });

        if (rpcError) {
            console.error("SQ-Market: Server-side transaction failed ->", rpcError.message);
            // Handle specific "Insufficient XP" error from SQL if it bypasses local check
            if (rpcError.message.includes('Insufficient XP')) {
                showToast("Insufficient XP!", 'error');
            } else {
                showToast("Transaction failed. Check your connection.", 'error');
            }
            return null;
        }

        // 3. LOG SUCCESSFUL SERVER CONFIRMATION
        console.log("SQ-Market: Atomic handshake successful. Code generated:", code);

        // 4. INSTANT WALLET HYDRATION
        setCurrentUser(prev => ({
            ...prev,
            xp: prev.xp - reward.xp_cost
        }));

        // 5. DATA POOL HYDRATION

        const { data: newRedemption, error: fetchError } = await supabase
            .from('redemptions')
            .select('*, profiles(full_name), rewards(title, created_by)')
            .eq('redemption_code', code)
            .maybeSingle();

        if (!fetchError && newRedemption) {
            setRedemptions(prev => {
                // Check if Realtime listener already added it to prevent duplicates
                if (prev.find(r => r.id === newRedemption.id)) return prev;
                return [...prev, newRedemption];
            });
            console.log("SQ-Market: Local redemption pool hydrated.");
        }

        // 6. FINAL RETURN
        // Returns the code (e.g. SQ-A1B2-99) to Rewards.jsx to show the success toast
        console.log("SQ-Market: Redemption process complete.");
        return code;

    } catch (err) {
        console.error("SQ-Market: Critical failure during redemption flow ->", err);
        showToast("Network reset. Please try redeeming again.", 'error');
        return null;
    }
};

    // --- VOUCHER VALIDATION FOR PARTNERS ---
    const verifyRedemptionCode = async (code) => {
        try {
            const cleanCode = code.trim().toUpperCase();
            console.log("SQ-System: Hard Search for Code:", cleanCode);
            
            // 1. Explicit Selection: Pulls the redemption row and the associated reward owner
            const { data, error } = await supabase
                .from('redemptions')
                .select(`
                    id,
                    redemption_code,
                    status,
                    reward_id,
                    rewards (
                        created_by,
                        title
                    )
                `)
                .eq('redemption_code', cleanCode)
                .maybeSingle(); 
    
            if (error) throw error;
    
            // 2. Handle 'Not Found' (This triggers if RLS blocks the partner or code is wrong)
            if (!data) {
                throw new Error("Voucher not found. Ensure the code is correct and belongs to your business.");
            }
            
            // 3. Robust Security Check
            const partnerId = currentUser?.id;
            const rewardOwner = data.rewards?.created_by;
            const isAdmin = currentUser?.role === 'Admin';
    
            if (rewardOwner !== partnerId && !isAdmin) {
                throw new Error("Security Violation: This voucher belongs to another partner.");
            }
    
            // 4. Status Guard
            if (data.status === 'verified') {
                throw new Error("This voucher has already been marked as USED.");
            }
    
            // 5. Update Status to 'verified'
            const { error: upErr } = await supabase
                .from('redemptions')
                .update({ 
                    status: 'verified', 
                    verified_at: new Date().toISOString() 
                })
                .eq('id', data.id);
    
            if (upErr) throw upErr;
    
            showToast(`Verified! ${data.rewards?.title || 'Reward'} marked as used.`, 'success');
            
            // 6. Refresh the local state so the partner sees the change
            fetchRedemptions(currentUser.id, currentUser.role);
            return true;
    
        } catch (err) {
            console.error("Verification Error:", err.message);
            showToast(err.message, 'error');
            return false;
        }
      };


  // --- 9. ADMIN MODERATION ENGINE ---

  const approveSubmission = async (submissionId) => {
    // 1. OPTIMISTIC UPDATE: Update UI instantly
    setQuestProgress(prev => prev.map(p => 
        p.id === submissionId ? { ...p, status: 'approved' } : p
    ));

    try {

        const { error } = await supabase
            .from('submissions')
            .update({ status: 'approved' })
            .eq('id', submissionId);

        if (error) throw error;  
        
        showToast("Verified! XP Awarded by Server.", 'success');
        
    } catch (e) {
        console.error("SQ-Admin Error:", e.message);
        showToast("Approval failed: " + e.message, 'error');

        fetchSubmissions(userRef.current?.id || currentUser?.id, 'Admin');
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

  return (
    <SideQuestContext.Provider value={{
      currentUser, isLoading, 
      users, quests, questProgress, redemptions, rewards,
      showAuthModal, setShowAuthModal,
      login, signup, logout,
      addQuest, updateQuest, deleteQuest, approveNewQuest,
      addReward, updateReward, deleteReward, approveNewReward, 
      acceptQuest, submitProof, approveSubmission, rejectSubmission,
      redeemReward, verifyRedemptionCode,  switchRole, quizBank, completedQuizIds, submitQuizAnswer,
      toast, showToast
    }}>
      {children}
    </SideQuestContext.Provider>
  );
};