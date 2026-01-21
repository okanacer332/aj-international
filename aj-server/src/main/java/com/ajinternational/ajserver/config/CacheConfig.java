package com.ajinternational.ajserver.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import com.fasterxml.jackson.databind.jsontype.PolymorphicTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Redis Cache Configuration for Performance Optimization
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Value("${spring.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.redis.port:6379}")
    private int redisPort;

    @Value("${spring.redis.password:}")
    private String redisPassword;

    @Value("${spring.cache.redis.time-to-live:3600000}")
    private long defaultTtl;

    /**
     * Redis Connection Factory
     */
    @Bean
    public LettuceConnectionFactory redisConnectionFactory() {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
        config.setHostName(redisHost);
        config.setPort(redisPort);
        if (redisPassword != null && !redisPassword.isEmpty()) {
            config.setPassword(redisPassword);
        }
        return new LettuceConnectionFactory(config);
    }

    /**
     * ObjectMapper with Java 8 Date/Time support for Redis serialization
     */
    private ObjectMapper redisObjectMapper() {
        PolymorphicTypeValidator ptv = BasicPolymorphicTypeValidator.builder()
                .allowIfSubType(Object.class)
                .build();

        return JsonMapper.builder()
                .addModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
                .activateDefaultTyping(ptv, ObjectMapper.DefaultTyping.NON_FINAL)
                .build();
    }

    /**
     * Redis Cache Manager
     */
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        // Custom serializer with Java 8 date/time support
        GenericJackson2JsonRedisSerializer jsonSerializer = new GenericJackson2JsonRedisSerializer(redisObjectMapper());

        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMillis(defaultTtl))
                .serializeKeysWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(jsonSerializer))
                .disableCachingNullValues();

        // Cache-specific configurations
        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();

        // MasterData: 24 hours
        cacheConfigurations.put("masterdata", defaultConfig.entryTtl(Duration.ofHours(24)));
        cacheConfigurations.put("products", defaultConfig.entryTtl(Duration.ofHours(24)));
        cacheConfigurations.put("services", defaultConfig.entryTtl(Duration.ofHours(24)));
        cacheConfigurations.put("skills", defaultConfig.entryTtl(Duration.ofHours(24)));
        cacheConfigurations.put("measures", defaultConfig.entryTtl(Duration.ofHours(24)));
        cacheConfigurations.put("currencies", defaultConfig.entryTtl(Duration.ofHours(24)));
        cacheConfigurations.put("units", defaultConfig.entryTtl(Duration.ofHours(24)));
        cacheConfigurations.put("productionUnits", defaultConfig.entryTtl(Duration.ofHours(24)));

        // Inventory: 1 hour
        cacheConfigurations.put("inventory", defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put("depots", defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put("materials", defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put("suppliers", defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put("customers", defaultConfig.entryTtl(Duration.ofHours(1)));

        // IAM: 30 minutes
        cacheConfigurations.put("users", defaultConfig.entryTtl(Duration.ofMinutes(30)));
        cacheConfigurations.put("roles", defaultConfig.entryTtl(Duration.ofMinutes(30)));

        // Personnel: 2 hours
        cacheConfigurations.put("personnel", defaultConfig.entryTtl(Duration.ofHours(2)));
        cacheConfigurations.put("bonusDefinitions", defaultConfig.entryTtl(Duration.ofHours(2)));

        // Dashboard: 5 minutes
        cacheConfigurations.put("dashboard", defaultConfig.entryTtl(Duration.ofMinutes(5)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .transactionAware()
                .build();
    }
}
