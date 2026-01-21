// src/hooks/use-pwa-install.ts
'use client';

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallState {
    isInstallable: boolean;
    isInstalled: boolean;
    isIOS: boolean;
    isAndroid: boolean;
    isStandalone: boolean;
    platform: 'ios' | 'android' | 'desktop' | 'unknown';
}

export function usePWAInstall() {
    const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [state, setState] = useState<PWAInstallState>({
        isInstallable: false,
        isInstalled: false,
        isIOS: false,
        isAndroid: false,
        isStandalone: false,
        platform: 'unknown',
    });

    useEffect(() => {
        // Detect platform
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIOS = /iphone|ipad|ipod/.test(userAgent);
        const isAndroid = /android/.test(userAgent);
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as any).standalone === true;

        setState(prev => ({
            ...prev,
            isIOS,
            isAndroid,
            isStandalone,
            isInstalled: isStandalone,
            platform: isIOS ? 'ios' : isAndroid ? 'android' : 'desktop',
        }));

        // Listen for install prompt (Chrome, Edge, Samsung Browser)
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e as BeforeInstallPromptEvent);
            setState(prev => ({ ...prev, isInstallable: true }));
        };

        // Listen for successful install
        const handleAppInstalled = () => {
            setInstallPrompt(null);
            setState(prev => ({
                ...prev,
                isInstallable: false,
                isInstalled: true
            }));
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const promptInstall = useCallback(async () => {
        if (!installPrompt) return false;

        try {
            await installPrompt.prompt();
            const { outcome } = await installPrompt.userChoice;

            if (outcome === 'accepted') {
                setInstallPrompt(null);
                setState(prev => ({
                    ...prev,
                    isInstallable: false,
                    isInstalled: true
                }));
                return true;
            }
            return false;
        } catch (error) {
            console.error('PWA install prompt error:', error);
            return false;
        }
    }, [installPrompt]);

    return {
        ...state,
        promptInstall,
        canPrompt: !!installPrompt,
    };
}
