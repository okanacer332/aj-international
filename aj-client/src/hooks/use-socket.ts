import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_BASE } from '@/lib/api-auth'; // Dinamik adresi buradan alacak
import { useAuthStore } from '@/stores/auth-store';

export function useOperationSocket(onMessageReceived: (msg: any) => void) {
    const clientRef = useRef<Client | null>(null);
    const { user, isLoading } = useAuthStore();

    useEffect(() => {
        if (isLoading || !user?.tenantId) return;

        // API_BASE artık dinamik (Örn: http://192.168.1.203:3344)
        // Eğer sonunda slash varsa temizle
        const baseUrl = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
        const socketUrl = `${baseUrl}/ws-operation`;

        console.log("🔌 Socket Hedef:", socketUrl);

        const client = new Client({
            webSocketFactory: () => new SockJS(socketUrl),
            reconnectDelay: 5000,
            
            onConnect: () => {
                const topic = `/topic/operation/${user.tenantId}`;
                // console.log('✅ Socket BAĞLANDI! Kanal:', topic);
                
                client.subscribe(topic, (message) => {
                    if (message.body) {
                        try {
                            const parsedBody = JSON.parse(message.body);
                            onMessageReceived(parsedBody);
                        } catch (e) {
                            console.error("❌ Mesaj parse hatası", e);
                        }
                    }
                });
            },
            
            // Hata loglarını sadece geliştirme ortamında açabiliriz
            // debug: (str) => console.log(str),
        });

        client.activate();
        clientRef.current = client;

        return () => {
            if (client.active) {
                client.deactivate();
            }
        };
    }, [user?.tenantId, isLoading, onMessageReceived]); // API_BASE dependency'e gerek yok, import ediliyor

    return clientRef.current;
}