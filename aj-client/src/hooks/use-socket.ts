import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from '@/stores/auth-store';

// Backend URL'ini buraya NET bir şekilde yazıyoruz.
// Normalde bunu .env dosyasından almalısın (NEXT_PUBLIC_API_URL)
// Şimdilik çalışması için backend portunu (3344) elle yazıyorum.
const SOCKET_URL = "http://localhost:3344/ws-operation"; 

interface SocketMessage {
    type: string;
    payload: any;
}

export function useOperationSocket(onMessageReceived: (msg: SocketMessage) => void) {
    const clientRef = useRef<Client | null>(null);
    const { user, isLoading } = useAuthStore();

    useEffect(() => {
        if (isLoading || !user?.tenantId) return;

        console.log("🔌 Socket Hedef:", SOCKET_URL);

        const client = new Client({
            // Buradaki URL artık Next.js'in (3001) değil, Java'nın (3344) adresi.
            webSocketFactory: () => new SockJS(SOCKET_URL),
            
            reconnectDelay: 5000, // Koparsa 5sn sonra tekrar dene
            
            // Debug loglarını açalım ki ne olduğunu görelim
            debug: (str) => {
                console.log('🔍 STOMP:', str);
            },
            
            onConnect: () => {
                const topic = `/topic/operation/${user.tenantId}`;
                console.log('✅ Socket BAĞLANDI! Kanal:', topic);
                
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
            
            onStompError: (frame) => {
                console.error('❌ Broker hatası:', frame.headers['message']);
            }
        });

        client.activate();
        clientRef.current = client;

        return () => {
            if (client.active) {
                client.deactivate();
            }
        };
    }, [user?.tenantId, isLoading, onMessageReceived]);

    return clientRef.current;
}