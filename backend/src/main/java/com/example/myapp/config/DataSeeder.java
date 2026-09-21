package com.example.myapp.config;

import com.example.myapp.entity.User;
import com.example.myapp.repos.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@Configuration
public class DataSeeder {

    @Bean
    public CommandLineRunner initDatabase(UserRepository userRepository, PasswordEncoder passwordEncoder, org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                jdbcTemplate.execute("ALTER TABLE Users ALTER COLUMN FullName NVARCHAR(255)");
            } catch (Exception e) {
                System.out.println("Could not alter table (might already be NVARCHAR or table doesn't exist yet): " + e.getMessage());
            }
            if (userRepository.count() == 0) {
                User admin = new User();
                admin.setFullName("Admin Manager");
                admin.setEmail("admin@fashionstore.vn");
                admin.setPasswordHash(passwordEncoder.encode("admin123"));
                admin.setRole("admin");
                admin.setStatus("active");
                admin.setPhone("0987654321");
                admin.setCreatedAt(LocalDateTime.now());
                userRepository.save(admin);
                
                System.out.println("✅ Đã tạo tài khoản mặc định: admin@fashionstore.vn / admin123");
            }
        };
    }
}
