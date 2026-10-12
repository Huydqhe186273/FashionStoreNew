package com.example.myapp.controller;

import com.example.myapp.model.*;
import com.example.myapp.security.CustomUserDetails;
import com.example.myapp.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            String jwt = authService.authenticateUser(loginRequest);
            
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            String role = userDetails.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "").toLowerCase();

            return ResponseEntity.ok(new JwtResponse(jwt, userDetails.getId(), userDetails.getEmail(), role));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/google-login")
    public ResponseEntity<?> googleLogin(@RequestBody com.example.myapp.model.GoogleLoginRequest request) {
        try {
            com.example.myapp.model.JwtResponse response = authService.googleLogin(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest signUpRequest) {
        try {
            authService.registerUser(signUpRequest);
            return ResponseEntity.ok("User registered successfully!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/send-register-otp")
    public ResponseEntity<?> sendRegisterOtp(@RequestParam String email) {
        try {
            authService.sendRegisterOtp(email);
            return ResponseEntity.ok("Mã OTP xác thực đăng ký đã được gửi tới Gmail của bạn!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/register-with-otp")
    public ResponseEntity<?> registerUserWithOtp(@RequestBody RegisterWithOtpRequest request) {
        try {
            RegisterRequest req = new RegisterRequest();
            req.setFullName(request.getFullName());
            req.setEmail(request.getEmail());
            req.setPassword(request.getPassword());
            authService.registerUserWithOtp(req, request.getOtp());
            return ResponseEntity.ok("Đăng ký tài khoản thành công!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/send-google-otp")
    public ResponseEntity<?> sendGoogleOtp(@RequestParam String email) {
        try {
            authService.sendGoogleOtp(email);
            return ResponseEntity.ok("Mã OTP xác thực Google đã được gửi tới Gmail của bạn!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/google-login-with-otp")
    public ResponseEntity<?> googleLoginWithOtp(@RequestBody GoogleLoginWithOtpRequest request) {
        try {
            GoogleLoginRequest req = new GoogleLoginRequest();
            req.setEmail(request.getEmail());
            req.setFullName(request.getFullName());
            req.setGoogleId(request.getGoogleId());
            JwtResponse response = authService.googleLoginWithOtp(req, request.getOtp());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            authService.forgotPassword(request.getEmail());
            return ResponseEntity.ok("OTP sent to your email!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        try {
            authService.verifyOtp(request.getEmail(), request.getOtp());
            return ResponseEntity.ok("OTP verified successfully!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            authService.resetPassword(request.getEmail(), request.getOtp(), request.getNewPassword());
            return ResponseEntity.ok("Password reset successfully!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
