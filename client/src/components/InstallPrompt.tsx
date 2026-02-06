import { useState, useEffect } from "react";
import { X, Download, Share, Smartphone, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as any).standalone === true;
    setIsStandalone(standalone);

    if (standalone) return;

    const dismissed = localStorage.getItem("elizabeth-install-dismissed-v2");
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    const ua = navigator.userAgent;
    const isiOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
    setIsIOS(isiOS);
    setIsMobile(mobile);

    if (isiOS) {
      setTimeout(() => setShowPrompt(true), 1500);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowPrompt(true), 1500);
    };

    window.addEventListener("beforeinstallprompt", handler);

    setTimeout(() => {
      if (!deferredPrompt && !isiOS) {
        setShowPrompt(true);
      }
    }, 3000);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("elizabeth-install-dismissed-v2", Date.now().toString());
  };

  if (!showPrompt || isStandalone) return null;

  const title = isMobile ? "Add Elizabeth to your phone" : "Install Elizabeth as a desktop app";
  const subtitle = isMobile
    ? "Access your healing journey anytime, right from your home screen."
    : "Get quick access to Elizabeth right from your desktop — no browser needed.";
  const Icon = isMobile ? Smartphone : Monitor;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-sm mx-4 mb-6 sm:mb-0 bg-[hsl(36,40%,98%)] border border-[hsl(30,25%,87%)] rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
        <div className="relative p-6 pb-4">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[hsl(30,20%,92%)] flex items-center justify-center text-[hsl(25,18%,48%)] hover:bg-[hsl(30,20%,88%)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg">
              <span className="text-white font-heading text-2xl font-bold">E</span>
            </div>

            <h2 className="text-xl font-heading font-bold text-[hsl(34,55%,45%)] tracking-wide mb-1">
              {title}
            </h2>
            <p className="text-sm text-[hsl(25,18%,48%)] font-body leading-relaxed">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-3">
          {isIOS ? (
            <div className="bg-[hsl(30,30%,95%)] border border-[hsl(30,22%,90%)] rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Share className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm text-[hsl(25,30%,28%)] font-body">
                  Tap the <strong>Share</strong> button in Safari
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Download className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm text-[hsl(25,30%,28%)] font-body">
                  Select <strong>"Add to Home Screen"</strong>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm text-[hsl(25,30%,28%)] font-body">
                  Elizabeth will appear as an app
                </p>
              </div>
            </div>
          ) : deferredPrompt ? (
            <Button
              onClick={handleInstall}
              className="w-full bg-primary text-white hover:bg-primary/90 font-heading tracking-wide h-12 text-base rounded-xl shadow-md"
            >
              <Download className="h-5 w-5 mr-2" />
              Install Elizabeth
            </Button>
          ) : (
            <div className="bg-[hsl(30,30%,95%)] border border-[hsl(30,22%,90%)] rounded-xl p-4 space-y-3">
              {isMobile ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Smartphone className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-sm text-[hsl(25,30%,28%)] font-body">
                    Open this page in your phone's browser, then use <strong>"Add to Home Screen"</strong> from the menu.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Monitor className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm text-[hsl(25,30%,28%)] font-body">
                      In Chrome: click the <strong>install icon</strong> in the address bar, or go to <strong>Menu &rarr; Install Elizabeth</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Download className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm text-[hsl(25,30%,28%)] font-body">
                      In Edge: click <strong>Menu &rarr; Apps &rarr; Install this site as an app</strong>
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          <button
            onClick={handleDismiss}
            className="w-full text-sm text-[hsl(25,18%,55%)] font-body py-2 hover:text-[hsl(25,18%,38%)] transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
