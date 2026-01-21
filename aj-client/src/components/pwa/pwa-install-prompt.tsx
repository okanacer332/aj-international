// src/components/pwa/pwa-install-prompt.tsx
'use client';

import { useEffect, useState } from 'react';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { Button } from '@/components/ui/button';
import { X, Download, Share, Plus, Smartphone, Monitor, Laptop } from 'lucide-react';
import { toast } from 'sonner';

interface PWAInstallPromptProps {
    delay?: number; // ms delay before showing (default: 3000)
    dismissDuration?: number; // days to hide after dismiss (default: 7)
}

export function PWAInstallPrompt({
    delay = 3000,
    dismissDuration = 7
}: PWAInstallPromptProps) {
    const [showPrompt, setShowPrompt] = useState(false);
    const [showIOSGuide, setShowIOSGuide] = useState(false);
    const {
        isInstallable,
        isInstalled,
        isIOS,
        isAndroid,
        isStandalone,
        platform,
        promptInstall,
        canPrompt
    } = usePWAInstall();

    // Check if prompt was recently dismissed
    useEffect(() => {
        const dismissedAt = localStorage.getItem('pwa-prompt-dismissed');
        if (dismissedAt) {
            const dismissDate = new Date(parseInt(dismissedAt));
            const daysSinceDismiss = (Date.now() - dismissDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceDismiss < dismissDuration) {
                return; // Don't show if recently dismissed
            }
        }

        // Show prompt after delay if installable and not already installed
        const timer = setTimeout(() => {
            if ((isInstallable || isIOS) && !isInstalled && !isStandalone) {
                setShowPrompt(true);
            }
        }, delay);

        return () => clearTimeout(timer);
    }, [isInstallable, isInstalled, isIOS, isStandalone, delay, dismissDuration]);

    const handleDismiss = () => {
        setShowPrompt(false);
        setShowIOSGuide(false);
        localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
    };

    const handleInstall = async () => {
        if (isIOS) {
            setShowIOSGuide(true);
            return;
        }

        if (canPrompt) {
            const installed = await promptInstall();
            if (installed) {
                toast.success('🎉 Uygulama başarıyla yüklendi!', {
                    description: 'Artık ana ekranınızdan erişebilirsiniz.',
                });
                setShowPrompt(false);
            }
        }
    };

    if (!showPrompt || isStandalone) return null;

    const PlatformIcon = isIOS ? Smartphone : isAndroid ? Smartphone : platform === 'desktop' ? Monitor : Laptop;

    // iOS Guide Modal
    if (showIOSGuide) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-card border rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in slide-in-from-bottom-4">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold">iOS'ta Ana Ekrana Ekle</h3>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleDismiss}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                            <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                                1
                            </div>
                            <div>
                                <p className="font-medium">Paylaş butonuna tıklayın</p>
                                <p className="text-sm text-muted-foreground">
                                    Safari'nin alt kısmındaki <Share className="inline h-4 w-4" /> simgesine dokunun
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                            <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                                2
                            </div>
                            <div>
                                <p className="font-medium">Ana Ekrana Ekle</p>
                                <p className="text-sm text-muted-foreground">
                                    Aşağı kaydırıp <Plus className="inline h-4 w-4" /> "Ana Ekrana Ekle" seçeneğini bulun
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                            <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                                3
                            </div>
                            <div>
                                <p className="font-medium">Ekle butonuna tıklayın</p>
                                <p className="text-sm text-muted-foreground">
                                    Sağ üst köşedeki "Ekle" butonuna dokunun
                                </p>
                            </div>
                        </div>
                    </div>

                    <Button
                        className="w-full mt-6"
                        onClick={handleDismiss}
                    >
                        Anladım
                    </Button>
                </div>
            </div>
        );
    }

    // Install Prompt Banner
    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300 md:left-auto md:right-6 md:max-w-sm">
            <div className="bg-card border rounded-xl shadow-2xl p-4">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center">
                        <PlatformIcon className="h-6 w-6 text-primary-foreground" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-semibold text-sm">Uygulamayı Yükle</h4>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {isIOS
                                        ? "Safari'den ana ekrana ekleyin"
                                        : "Hızlı erişim için cihazınıza yükleyin"
                                    }
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 -mt-1 -mr-2"
                                onClick={handleDismiss}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex gap-2 mt-3">
                            <Button
                                size="sm"
                                className="h-8 flex-1"
                                onClick={handleInstall}
                            >
                                <Download className="h-4 w-4 mr-1.5" />
                                {isIOS ? 'Nasıl Yapılır?' : 'Yükle'}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8"
                                onClick={handleDismiss}
                            >
                                Sonra
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Simple toast-based install prompt
 * Call this function to show a non-intrusive toast
 */
export function showPWAInstallToast() {
    const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    if (isStandalone) return;

    toast('📱 Uygulamayı Yükleyebilirsiniz', {
        description: isIOS
            ? "Safari'de Paylaş → Ana Ekrana Ekle"
            : 'Hızlı erişim için cihazınıza yükleyin',
        action: {
            label: isIOS ? 'Tamam' : 'Yükle',
            onClick: () => {
                const event = new CustomEvent('trigger-pwa-install');
                window.dispatchEvent(event);
            },
        },
        duration: 8000,
    });
}
