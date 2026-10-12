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
        String email = loginRequest.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Tài khoản email không đúng."));

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Mật khẩu không đúng.");
        }

        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(email, loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        return jwtUtils.generateJwtToken(authentication);
    }

    public com.example.myapp.model.JwtResponse googleLogin(com.example.myapp.model.GoogleLoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            user = new User();
            user.setEmail(email);
            user.setFullName(request.getFullName() != null && !request.getFullName().isBlank() ? request.getFullName() : email);
            user.setPasswordHash(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
            user.setRole("customer");
            user.setStatus("active");
            user.setCreatedAt(LocalDateTime.now());
            user = userRepository.save(user);
        }

        String jwt = jwtUtils.generateTokenFromUser(user);
        String role = user.getRole() != null ? user.getRole().toLowerCase() : "customer";

        return new com.example.myapp.model.JwtResponse(jwt, user.getUserId(), user.getEmail(), role);
    }

    public void sendRegisterOtp(String email) {
        email = email.trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email này đã được sử dụng!");
        }
        emailService.sendOtpEmail(email);
    }

    public void registerUserWithOtp(RegisterRequest signUpRequest, String otp) {
        String email = signUpRequest.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Error: Email is already in use!");
        }
        if (!emailService.verifyOtp(email, otp, true)) {
            throw new RuntimeException("Mã OTP xác thực đăng ký không đúng hoặc đã hết hạn!");
        }

        User user = new User();
        user.setFullName(signUpRequest.getFullName());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(signUpRequest.getPassword()));
        user.setRole("customer");
        user.setStatus("active");
        user.setCreatedAt(LocalDateTime.now());

        userRepository.save(user);
    }

    public void sendGoogleOtp(String email) {
        email = email.trim().toLowerCase();
        emailService.sendOtpEmail(email);
    }

    public com.example.myapp.model.JwtResponse googleLoginWithOtp(com.example.myapp.model.GoogleLoginRequest request, String otp) {
        String email = request.getEmail().trim().toLowerCase();
        if (!emailService.verifyOtp(email, otp, true)) {
            throw new RuntimeException("Mã OTP xác thực Google không đúng hoặc đã hết hạn!");
        }
        return googleLogin(request);
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
        email = email.trim().toLowerCase();
        if (!userRepository.existsByEmail(email)) {
            throw new RuntimeException("Không tìm thấy email này trong hệ thống.");
        }
        emailService.sendOtpEmail(email);
    }

    public void verifyOtp(String email, String otp) {
        email = email.trim().toLowerCase();
        if (!emailService.verifyOtp(email, otp, false)) {
            throw new RuntimeException("Mã OTP không đúng hoặc đã hết hạn.");
        }
    }

    public void resetPassword(String email, String otp, String newPassword) {
        email = email.trim().toLowerCase();
        if (!emailService.verifyOtp(email, otp, true)) {
            throw new RuntimeException("Mã OTP không đúng hoặc đã hết hạn.");
        }

        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng."));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
