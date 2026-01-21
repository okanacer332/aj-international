package com.ajinternational.ajserver.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;

/**
 * WebSocket Configuration with Performance Optimizations
 * 
 * Includes:
 * - Message size limits to prevent memory issues
 * - Send buffer limits for backpressure handling
 * - Time limits to prevent slow clients from blocking
 * - Heartbeat for connection health monitoring
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    // Performance tuning constants
    private static final int MAX_MESSAGE_SIZE = 128 * 1024; // 128 KB max message
    private static final int SEND_BUFFER_SIZE = 512 * 1024; // 512 KB send buffer
    private static final int SEND_TIME_LIMIT = 20 * 1000; // 20 seconds send timeout

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic")
                .setTaskScheduler(heartBeatScheduler())
                .setHeartbeatValue(new long[] { 10000, 10000 }); // 10 second heartbeats
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-operation")
                .setAllowedOriginPatterns("*")
                .withSockJS()
                .setStreamBytesLimit(MAX_MESSAGE_SIZE)
                .setHttpMessageCacheSize(1000)
                .setDisconnectDelay(30 * 1000); // 30 second disconnect delay
    }

    /**
     * Configure WebSocket transport for performance
     */
    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration registry) {
        registry.setMessageSizeLimit(MAX_MESSAGE_SIZE)
                .setSendBufferSizeLimit(SEND_BUFFER_SIZE)
                .setSendTimeLimit(SEND_TIME_LIMIT);
    }

    /**
     * TaskScheduler required for WebSocket heartbeat functionality
     */
    @Bean
    public TaskScheduler heartBeatScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(1);
        scheduler.setThreadNamePrefix("ws-heartbeat-");
        scheduler.initialize();
        return scheduler;
    }
}