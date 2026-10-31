package com.example.myapp.config;

import com.cloudinary.Cloudinary;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class CloudinaryConfig {

    private static final Logger log = LoggerFactory.getLogger(CloudinaryConfig.class);

    @Value("${CLOUDINARY_URL:#{null}}")
    private String cloudinaryUrl;

    @Value("${cloudinary.cloud-name:demo}")
    private String cloudName;

    @Value("${cloudinary.api-key:123456789012345}")
    private String apiKey;

    @Value("${cloudinary.api-secret:abcdefghijklmnopqrstuvwxyz12}")
    private String apiSecret;

    @Bean
    public Cloudinary cloudinary() {
        // 1. Ưu tiên sử dụng chuỗi CLOUDINARY_URL nếu có
        if (cloudinaryUrl != null && !cloudinaryUrl.isBlank() && cloudinaryUrl.startsWith("cloudinary://")) {
            log.info("Khởi tạo Cloudinary từ chuỗi CLOUDINARY_URL");
            return new Cloudinary(cloudinaryUrl);
        }

        // 2. Khởi tạo từ từng tham số cloud_name, api_key, api_secret
        Map<String, String> config = new HashMap<>();
        config.put("cloud_name", cloudName);
        config.put("api_key", apiKey);
        config.put("api_secret", apiSecret);
        config.put("secure", "true");
        log.info("Khởi tạo Cloudinary với cloud_name={}", cloudName);
        return new Cloudinary(config);
    }
}
