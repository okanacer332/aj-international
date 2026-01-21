package com.ajinternational.ajserver.config;

import org.springframework.boot.web.server.Compression;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.boot.web.servlet.server.ConfigurableServletWebServerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.unit.DataSize;

/**
 * GZIP/Brotli Compression Configuration
 * 
 * Compresses API responses to reduce bandwidth and improve load times.
 * Applies to JSON, XML, and text content types over 1KB.
 */
@Configuration
public class CompressionConfig {

    @Bean
    public WebServerFactoryCustomizer<ConfigurableServletWebServerFactory> compressionCustomizer() {
        return factory -> {
            Compression compression = new Compression();
            compression.setEnabled(true);
            compression.setMinResponseSize(DataSize.ofKilobytes(1)); // Compress responses > 1KB
            compression.setMimeTypes(new String[] {
                    "application/json",
                    "application/xml",
                    "text/html",
                    "text/plain",
                    "text/css",
                    "text/javascript",
                    "application/javascript"
            });
            factory.setCompression(compression);
        };
    }
}
