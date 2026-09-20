package com.example.myapp.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    // Cấu hình chuỗi bảo mật HTTP: tắt CSRF và cho phép tất cả request khi phát triển.
    // Cần thay bằng cấu hình xác thực/phân quyền trước khi triển khai production.
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        // Tạm thời tắt bảo mật để bạn dễ dàng test API khi mới học
        http.csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }
}
