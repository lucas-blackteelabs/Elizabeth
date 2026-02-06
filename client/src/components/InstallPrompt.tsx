import { useState, useEffect } from "react";
import { X, Download, Plus } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as any).standalone === true;
    setIsStandalone(standalone);
    if (standalone) return;

    const ua = navigator.userAgent;
    const isiOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isiOS);

    if (isiOS) {
      setShowBanner(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    setTimeout(() => {
      setShowBanner(true);
    }, 1000);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  if (!showBanner || isStandalone) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-primary text-white shadow-md animate-in slide-in-from-top duration-300">
      <div className="flex items-center justify-between px-3 py-2 max-w-screen-xl mx-auto gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="font-heading text-sm font-bold">E</span>
          </div>
          <p className="text-xs font-body truncate">
            {isIOS
              ? <>Tap <strong>Share</strong> then <strong>"Add to Home Screen"</strong> to install</>
              : deferredPrompt
                ? <>Install Elizabeth for quick access</>
                : <>Add Elizabeth to your home screen from your browser menu</>
            }
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {deferredPrompt && !isIOS && (
            <button
              onClick={handleInstall}
              className="flex items-center gap-1 bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 text-xs font-heading tracking-wide transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Install
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="w-6 h-6 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
