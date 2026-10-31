package com.example.myapp;

import com.example.myapp.entity.Cart;
import com.example.myapp.entity.User;
import com.example.myapp.model.GoogleLoginRequest;
import com.example.myapp.model.GoogleUserInfo;
import com.example.myapp.model.JwtResponse;
import com.example.myapp.repos.CartRepository;
import com.example.myapp.repos.UserRepository;
import com.example.myapp.security.JwtUtils;
import com.example.myapp.service.AuthService;
import com.example.myapp.service.EmailService;
import com.example.myapp.service.GoogleTokenVerifierService;
import com.example.myapp.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceGoogleLoginTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtils jwtUtils;

    @Mock
    private EmailService emailService;

    @Mock
    private GoogleTokenVerifierService googleTokenVerifierService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private CartRepository cartRepository;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = new User();
        sampleUser.setUserId(101);
        sampleUser.setEmail("testuser@gmail.com");
        sampleUser.setFullName("Nguyen Van Test");
        sampleUser.setRole("customer");
        sampleUser.setStatus("active");
    }

    @Test
    @DisplayName("Đăng nhập Google - Tài khoản mới: Tự động đăng ký, tạo giỏ hàng, thông báo chào mừng và sinh JWT")
    void testGoogleLogin_NewUser_Success() {
        GoogleLoginRequest request = GoogleLoginRequest.builder()
                .email("newuser@gmail.com")
                .fullName("New Google User")
                .googleId("sub-12345")
                .build();

        when(userRepository.findByEmail("newuser@gmail.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hashed-random-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setUserId(202);
            return u;
        });
        when(cartRepository.findByUserId(202)).thenReturn(Optional.empty());
        when(jwtUtils.generateTokenFromUser(any(User.class))).thenReturn("fake-jwt-token-for-new-user");

        JwtResponse response = authService.googleLogin(request);

        assertNotNull(response);
        assertEquals("fake-jwt-token-for-new-user", response.getToken());
        assertEquals("newuser@gmail.com", response.getEmail());
        assertEquals("customer", response.getRole());
        assertEquals(202, response.getId());

        verify(userRepository, times(1)).save(any(User.class));
        verify(cartRepository, times(1)).save(any(Cart.class));
        verify(notificationService, times(1)).createNotification(eq(202), eq("system"), contains("Chào mừng"));
    }

    @Test
    @DisplayName("Đăng nhập Google - Tài khoản đã tồn tại: Đăng nhập thành công và trả về JWT")
    void testGoogleLogin_ExistingUser_Success() {
        GoogleLoginRequest request = GoogleLoginRequest.builder()
                .email("testuser@gmail.com")
                .fullName("Nguyen Van Test")
                .googleId("sub-101")
                .build();

        when(userRepository.findByEmail("testuser@gmail.com")).thenReturn(Optional.of(sampleUser));
        when(jwtUtils.generateTokenFromUser(sampleUser)).thenReturn("existing-user-jwt");

        JwtResponse response = authService.googleLogin(request);

        assertNotNull(response);
        assertEquals("existing-user-jwt", response.getToken());
        assertEquals("testuser@gmail.com", response.getEmail());
        assertEquals(101, response.getId());
        assertEquals("customer", response.getRole());

        // Không tạo mới user
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Đăng nhập Google - Tài khoản bị khóa (locked): Ném lỗi và từ chối truy cập")
    void testGoogleLogin_LockedUser_ThrowsException() {
        sampleUser.setStatus("locked");
        GoogleLoginRequest request = GoogleLoginRequest.builder()
                .email("testuser@gmail.com")
                .fullName("Nguyen Van Test")
                .build();

        when(userRepository.findByEmail("testuser@gmail.com")).thenReturn(Optional.of(sampleUser));

        RuntimeException exception = assertThrows(RuntimeException.class, () -> authService.googleLogin(request));
        assertTrue(exception.getMessage().contains("khóa"));
    }

    @Test
    @DisplayName("Đăng nhập Google - Dùng Google ID Token: Gọi GoogleTokenVerifierService để chứng thực token")
    void testGoogleLogin_WithIdToken_CallsVerifier() {
        String mockIdToken = "google.oauth2.idtoken.jwt";
        GoogleLoginRequest request = GoogleLoginRequest.builder()
                .idToken(mockIdToken)
                .build();

        GoogleUserInfo verifiedInfo = GoogleUserInfo.builder()
                .email("verified@gmail.com")
                .name("Verified Google User")
                .googleId("google-sub-999")
                .emailVerified(true)
                .build();

        when(googleTokenVerifierService.verifyToken(mockIdToken)).thenReturn(verifiedInfo);
        when(userRepository.findByEmail("verified@gmail.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hashed-pwd");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setUserId(303);
            return u;
        });
        when(jwtUtils.generateTokenFromUser(any(User.class))).thenReturn("jwt-from-verified-token");

        JwtResponse response = authService.googleLogin(request);

        assertNotNull(response);
        assertEquals("verified@gmail.com", response.getEmail());
        assertEquals("jwt-from-verified-token", response.getToken());
        verify(googleTokenVerifierService, times(1)).verifyToken(mockIdToken);
    }

    @Test
    @DisplayName("Gửi mã OTP Google - Kiểm tra nếu email bị khóa thì không gửi OTP")
    void testSendGoogleOtp_LockedUser_ThrowsException() {
        sampleUser.setStatus("locked");
        when(userRepository.findByEmail("testuser@gmail.com")).thenReturn(Optional.of(sampleUser));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> authService.sendGoogleOtp("testuser@gmail.com"));
        assertTrue(ex.getMessage().contains("khóa"));
        verify(emailService, never()).sendOtpEmail(anyString());
    }

    @Test
    @DisplayName("Đăng nhập Google bằng OTP - OTP không chính xác hoặc hết hạn: Ném ngoại lệ")
    void testGoogleLoginWithOtp_InvalidOtp_ThrowsException() {
        GoogleLoginRequest req = GoogleLoginRequest.builder()
                .email("testuser@gmail.com")
                .build();

        when(emailService.verifyOtp("testuser@gmail.com", "999999", true)).thenReturn(false);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> authService.googleLoginWithOtp(req, "999999"));
        assertTrue(ex.getMessage().contains("không đúng"));
    }

    @Test
    @DisplayName("Đăng nhập Google bằng OTP - OTP chính xác: Xác thực thành công và sinh JWT")
    void testGoogleLoginWithOtp_ValidOtp_Success() {
        GoogleLoginRequest req = GoogleLoginRequest.builder()
                .email("testuser@gmail.com")
                .build();

        when(emailService.verifyOtp("testuser@gmail.com", "123456", true)).thenReturn(true);
        when(userRepository.findByEmail("testuser@gmail.com")).thenReturn(Optional.of(sampleUser));
        when(jwtUtils.generateTokenFromUser(sampleUser)).thenReturn("valid-otp-jwt");

        JwtResponse response = authService.googleLoginWithOtp(req, "123456");

        assertNotNull(response);
        assertEquals("valid-otp-jwt", response.getToken());
        assertEquals("testuser@gmail.com", response.getEmail());
    }

    @Test
    @DisplayName("Đăng nhập Google - Email sai định dạng: Ném ngoại lệ IllegalArgumentException")
    void testGoogleLogin_InvalidEmail_ThrowsException() {
        GoogleLoginRequest req = GoogleLoginRequest.builder()
                .email("invalid-email-format")
                .build();

        assertThrows(IllegalArgumentException.class, () -> authService.googleLogin(req));
    }
}

