import React, { useState, useEffect } from 'react';
import { Download, Smartphone, SmartphoneNfc, X, ChevronRight, Apple, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

export const InstallApp: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAlreadyInstalled, setIsAlreadyInstalled] = useState(false);
  const [apkLink, setApkLink] = useState('');

  useEffect(() => {
    fetchApkLink();
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsAlreadyInstalled(true);
      return;
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If it's iOS and not already installed, show it
    if (isIOSDevice) {
      setIsVisible(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const fetchApkLink = async () => {
    try {
      const { data } = await supabase.from('app_settings').select('value').eq('key', 'general').single();
      if (data?.value?.apkLink) {
        setApkLink(data.value.apkLink);
      }
    } catch (e) {
      console.error('Error fetching APK link:', e);
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      handleApkDownload();
      return;
    }
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleApkDownload = () => {
    if (apkLink) {
      window.open(apkLink, '_blank');
    } else {
      alert('To install this software on your mobile:\n\n1. Open this website in Chrome on Android.\n2. Tap the three dots (menu) and select "Install App".\n\nFor iOS:\n1. Open in Safari.\n2. Tap the Share button and "Add to Home Screen".');
    }
  };

  if (isAlreadyInstalled) return null;
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-24 left-4 right-4 z-[99] lg:hidden"
      >
        <div className="bg-white rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-indigo-100 overflow-hidden">
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                <SmartphoneNfc className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 tracking-tight leading-tight">Install Mobile Software</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Application for Mobile Device</p>
              </div>
            </div>
            <button 
              onClick={() => setIsVisible(false)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="px-5 pb-5">
            {isIOS ? (
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 rounded-2xl flex items-center gap-3 border border-amber-100">
                  <Apple className="w-5 h-5 text-amber-600" />
                  <p className="text-[11px] font-bold text-amber-700 leading-snug">
                    Tap the "Share" button below and then select "Add to Home Screen" to install.
                  </p>
                </div>
                <button 
                  className="w-full py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <Info className="w-4 h-4" />
                  iOS Setup Guide
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 font-medium leading-relaxed px-1">
                  Enjoy a faster, standalone experience. Click below to install the software on your Android phone.
                </p>
                <div className="flex gap-3">
                   <button 
                    onClick={handleInstallClick}
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Install Now
                  </button>
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      alert('APK direct download is coming soon. Please use the "Install Now" button to add the app to your home screen instantly.');
                    }}
                    className="px-4 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-slate-100"
                  >
                    <Smartphone className="w-4 h-4" />
                    APK
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
