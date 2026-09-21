package com.example.myapp.service;

import com.example.myapp.entity.User;
import com.example.myapp.model.LoginRequest;
import com.example.myapp.model.RegisterRequest;
import com.example.myapp.repos.UserRepository;
import com.example.myapp.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final EmailService emailService;

    public String authenticateUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        return jwtUtils.generateJwtToken(authentication);
    }

    public void registerUser(RegisterRequest signUpRequest) {
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        User user = new User();
        user.setFullName(signUpRequest.getFullName());
        user.setEmail(signUpRequest.getEmail());
        user.setPasswordHash(passwordEncoder.encode(signUpRequest.getPassword()));
        user.setRole("customer");
        user.setStatus("active");
        user.setCreatedAt(LocalDateTime.now());

        userRepository.save(user);
    }

    public void forgotPassword(String email) {
        if (!userRepository.existsByEmail(email)) {
            throw new RuntimeException("Error: Email not found.");
        }
        emailService.sendOtpEmail(email);
    }

    public void verifyOtp(String email, String otp) {
        if (!emailService.verifyOtp(email, otp, false)) {
            throw new RuntimeException("Error: Invalid or expired OTP.");
        }
    }

    public void resetPassword(String email, String otp, String newPassword) {
        if (!emailService.verifyOtp(email, otp, true)) {
            throw new RuntimeException("Error: Invalid or expired OTP.");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Error: User not found."));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
