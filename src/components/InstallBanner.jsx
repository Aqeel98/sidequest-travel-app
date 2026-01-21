import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

const InstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // --- 1. MEMORY CHECK ---
    // If user previously closed it, don't show it again.
    if (localStorage.getItem('sq_install_dismissed') === 'true') {
        return;
    }

    // --- 2. HARDENED PWA DETECTION ---
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = window.navigator.standalone === true; // Specific for iOS
    
    // If running as an App (Android OR iOS), STOP here.
    if (isStandalone || isIOSStandalone) {
      return; 
    }

    // --- 3. DEVICE DETECTION ---
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    
    if (isIosDevice) {
      setIsIOS(true);
      setTimeout(() => setIsVisible(true), 3000);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault(); 
      setDeferredPrompt(e); 
      setIsVisible(true);   
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
      setIsVisible(false);
      // Save to memory so it doesn't pop up again
      localStorage.setItem('sq_install_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[1400] animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-5 rounded-2xl shadow-2xl border border-white/10 flex items-start gap-4">
        
        <div className="bg-brand-500 p-2.5 rounded-xl shrink-0">
           <Download size={24} className="text-white" />
        </div>

        <div className="flex-1">
          <h4 className="font-bold text-lg leading-tight mb-1">Install SideQuest</h4>
          
          {isIOS ? (
            <div className="text-xs text-slate-300 leading-relaxed space-y-1">
              <p>Install this app for offline maps & faster loading.</p>
              <p>
                1. Tap <span className="font-bold text-blue-400 inline-flex items-center mx-0.5"><Share size={12} className="mr-0.5"/> Share</span>
              </p>
              <p>
                2. Scroll down & tap <span className="font-bold text-white">"Add to Home Screen"</span>
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-300 mb-3">
              Add to your home screen for the best experience. Works offline!
            </p>
          )}

          {!isIOS && (
            <button 
              onClick={handleInstallClick}
              className="mt-1 bg-brand-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-brand-500 transition-colors w-full sm:w-auto shadow-lg"
            >
              Install App Now
            </button>
          )}
        </div>

        {/* CLOSE BUTTON WITH MEMORY */}
        <button 
          onClick={handleDismiss} 
          className="text-slate-500 hover:text-white p-2 -mt-2 -mr-2 rounded-full hover:bg-white/10"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default InstallBanner;