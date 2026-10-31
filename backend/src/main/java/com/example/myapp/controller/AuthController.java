package com.example.myapp.controller;

import com.example.myapp.model.*;
import com.example.myapp.security.CustomUserDetails;
import com.example.myapp.service.AuthService;
import com.example.myapp.service.GoogleTokenVerifierService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Các API xác thực, đăng nhập hệ thống và Google OAuth2")
public class AuthController {

    private final AuthService authService;
    private final GoogleTokenVerifierService googleTokenVerifierService;

    @Operation(summary = "Đăng nhập bằng Email và Mật khẩu truyền thống")
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            String jwt = authService.authenticateUser(loginRequest);

            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            String role = userDetails.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "").toLowerCase();

            return ResponseEntity.ok(new JwtResponse(jwt, userDetails.getId(), userDetails.getEmail(), role, userDetails.getUsername()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Operation(summary = "Đăng nhập với Google (Hỗ trợ Google ID Token từ GIS hoặc thông tin Google)")
    @PostMapping("/google-login")
    public ResponseEntity<?> googleLogin(@RequestBody GoogleLoginRequest request) {
        try {
            JwtResponse response = authService.googleLogin(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException iae) {
            return ResponseEntity.badRequest().body(iae.getMessage());
        } catch (Exception e) {
            if (e.getMessage() != null && e.getMessage().contains("bị khóa")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Operation(summary = "Xác thực và xem chi tiết Google ID Token mà không cần đăng nhập")
    @PostMapping("/google-verify-token")
    public ResponseEntity<?> verifyGoogleToken(@RequestBody Map<String, String> payload) {
        try {
            String token = payload.get("idToken");
            if (token == null || token.isBlank()) {
                token = payload.get("credential");
            }
            GoogleUserInfo info = googleTokenVerifierService.verifyToken(token);
            return ResponseEntity.ok(info);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Operation(summary = "Gửi mã OTP 6 số xác thực đăng nhập Google về hòm thư Gmail")
    @PostMapping("/send-google-otp")
    public ResponseEntity<?> sendGoogleOtp(@RequestParam String email) {
        try {
            authService.sendGoogleOtp(email);
            return ResponseEntity.ok("Mã OTP xác thực Google đã được gửi tới Gmail của bạn!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Operation(summary = "Đăng nhập Google kèm xác thực mã OTP 6 số gửi qua Gmail")
    @PostMapping("/google-login-with-otp")
    public ResponseEntity<?> googleLoginWithOtp(@RequestBody GoogleLoginWithOtpRequest request) {
        try {
            GoogleLoginRequest req = GoogleLoginRequest.builder()
                    .email(request.getEmail())
                    .fullName(request.getFullName())
                    .googleId(request.getGoogleId())
                    .idToken(request.getIdToken())
                    .credential(request.getCredential())
                    .build();
            JwtResponse response = authService.googleLoginWithOtp(req, request.getOtp());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            if (e.getMessage() != null && e.getMessage().contains("bị khóa")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Operation(summary = "Đăng ký tài khoản người dùng mới (Customer)")
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest signUpRequest) {
        try {
            authService.registerUser(signUpRequest);
            return ResponseEntity.ok("User registered successfully!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Operation(summary = "Gửi mã OTP xác thực đăng ký tài khoản")
    @PostMapping("/send-register-otp")
    public ResponseEntity<?> sendRegisterOtp(@RequestParam String email) {
        try {
            authService.sendRegisterOtp(email);
            return ResponseEntity.ok("Mã OTP xác thực đăng ký đã được gửi tới Gmail của bạn!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Operation(summary = "Đăng ký tài khoản kèm mã OTP xác thực")
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

    @Operation(summary = "Gửi yêu cầu quên mật khẩu (gửi OTP về email)")
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            authService.forgotPassword(request.getEmail());
            return ResponseEntity.ok("OTP sent to your email!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Operation(summary = "Xác minh mã OTP quên mật khẩu")
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        try {
            authService.verifyOtp(request.getEmail(), request.getOtp());
            return ResponseEntity.ok("OTP verified successfully!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Operation(summary = "Đặt lại mật khẩu mới sau khi xác thực OTP")
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
