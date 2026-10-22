package com.example.myapp.config;

import com.example.myapp.security.CustomUserDetailsService;
import com.example.myapp.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final JwtAuthenticationFilter jwtAuthFilter;

    public SecurityConfig(CustomUserDetailsService userDetailsService, JwtAuthenticationFilter jwtAuthFilter) {
        this.userDetailsService = userDetailsService;
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new PasswordEncoder() {
            private final BCryptPasswordEncoder bcrypt = new BCryptPasswordEncoder();

            @Override
            public String encode(CharSequence rawPassword) {
                return bcrypt.encode(rawPassword);
            }

            @Override
            public boolean matches(CharSequence rawPassword, String encodedPassword) {
                if (encodedPassword == null) {
                    return false;
                }
                if (encodedPassword.startsWith("$2a$") || encodedPassword.startsWith("$2b$") || encodedPassword.startsWith("$2y$")) {
                    return bcrypt.matches(rawPassword, encodedPassword);
                }
                // Fallback ho tro so khop neu con tai khoan cu luu plaintext
                return rawPassword.toString().equals(encodedPassword);
            }
        };
    }

    @Bean
    // Cấu hình chuỗi bảo mật HTTP: tắt CSRF và cho phép tất cả request khi phát triển.
    // Cần thay bằng cấu hình xác thực/phân quyền trước khi triển khai production.
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors(org.springframework.security.config.Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> 
                auth.requestMatchers("/api/auth/**", "/api/payment/webhook").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/customer/reviews/eligible").authenticated()
                    .requestMatchers(HttpMethod.POST, "/api/customer/reviews").authenticated()
                    .requestMatchers(HttpMethod.PUT, "/api/customer/reviews/**").authenticated()
                    .requestMatchers(HttpMethod.DELETE, "/api/customer/reviews/**").authenticated()
                    .requestMatchers("/api/customer/**").permitAll()
                    .requestMatchers("/api/staff/**").hasAnyRole("STAFF", "ADMIN")
                    .requestMatchers("/api/admin/dashboard/**", "/api/admin/users/**", "/api/admin/staff/**", "/api/admin/coupons/**", "/api/admin/reports/**").hasRole("ADMIN")
                    .requestMatchers("/api/admin/orders/**", "/api/admin/products/**", "/api/admin/variants/**", "/api/admin/categories/**", "/api/admin/inbound/**").hasAnyRole("STAFF", "ADMIN")
                    .requestMatchers("/api/manager/**").hasRole("ADMIN")
                    .requestMatchers("/api/profile/**", "/api/cart/**", "/api/orders/**", "/api/payment/**").authenticated()
                    .anyRequest().permitAll()
            );

        http.exceptionHandling(ex -> ex
            .authenticationEntryPoint((request, response, authException) -> {
                response.setStatus(jakarta.servlet.http.HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"" + authException.getMessage() + "\"}");
            })
        );

        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
