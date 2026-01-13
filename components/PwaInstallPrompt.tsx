"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone } from "lucide-react";

const DISMISS_KEY = "kaito_pwa_dismissed";
const INSTALLED_KEY = "kaito_pwa_installed";
const DISMISS_DAYS = 7;

export function PwaInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Check if running as installed PWA
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as any).standalone === true;

        if (isStandalone) {
            localStorage.setItem(INSTALLED_KEY, "true");
            return;
        }

        // Check if already installed
        if (localStorage.getItem(INSTALLED_KEY) === "true") {
            return;
        }

        // Check if dismissed recently
        const dismissedAt = localStorage.getItem(DISMISS_KEY);
        if (dismissedAt) {
            const dismissDate = new Date(dismissedAt);
            const now = new Date();
            const diffDays = Math.floor((now.getTime() - dismissDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays < DISMISS_DAYS) {
                return;
            }
        }

        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        };

        window.addEventListener("beforeinstallprompt", handler);

        // Listen for successful installation
        window.addEventListener("appinstalled", () => {
            localStorage.setItem(INSTALLED_KEY, "true");
            setShowPrompt(false);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            localStorage.setItem(INSTALLED_KEY, "true");
            setDeferredPrompt(null);
            setShowPrompt(false);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem(DISMISS_KEY, new Date().toISOString());
    };

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
                >
                    <div className="glass-card p-6 rounded-2xl border-primary/20 shadow-2xl backdrop-blur-xl bg-black/80">
                        <button
                            onClick={handleDismiss}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-primary/10 rounded-xl">
                                <Smartphone className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">Instalar Kaito Vision</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Acesse mais rápido! Instale nosso app na sua tela inicial para uma melhor experiência.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleInstall}
                                        className="flex-1 bg-primary hover:bg-primary/90 text-white py-2.5 rounded-xl font-semibold text-sm transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] flex items-center justify-center gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        Instalar
                                    </button>
                                    <button
                                        onClick={handleDismiss}
                                        className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-xl font-semibold text-sm transition-all border border-white/10"
                                    >
                                        Agora não
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
