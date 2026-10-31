package com.example.myapp.service;

import com.example.myapp.entity.Cart;
import com.example.myapp.entity.User;
import com.example.myapp.model.GoogleLoginRequest;
import com.example.myapp.model.GoogleUserInfo;
import com.example.myapp.model.JwtResponse;
import com.example.myapp.model.LoginRequest;
import com.example.myapp.model.RegisterRequest;
import com.example.myapp.repos.CartRepository;
import com.example.myapp.repos.UserRepository;
import com.example.myapp.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final EmailService emailService;
    private final GoogleTokenVerifierService googleTokenVerifierService;
    private final NotificationService notificationService;
    private final CartRepository cartRepository;

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

    /**
     * Xử lý đăng nhập / đăng ký tự động qua tài khoản Google.
     * Hỗ trợ xác thực bằng:
     * 1. Google OAuth2 ID Token / Credential (từ Google Identity Services)
     * 2. Email trực tiếp hoặc kèm OTP (trong môi trường phát triển / test)
     */
    public JwtResponse googleLogin(GoogleLoginRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Yêu cầu đăng nhập Google không hợp lệ!");
        }

        String email;
        String fullName;
        String googleId;

        // 1. Kiểm tra nếu có truyền Google ID Token / Credential
        String token = (request.getIdToken() != null && !request.getIdToken().isBlank())
                ? request.getIdToken()
                : request.getCredential();

        if (token != null && !token.isBlank()) {
            GoogleUserInfo userInfo = googleTokenVerifierService.verifyToken(token);
            email = userInfo.getEmail();
            fullName = userInfo.getName();
            googleId = userInfo.getGoogleId();
        } else {
            if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
                throw new IllegalArgumentException("Vui lòng cung cấp Google ID Token hoặc địa chỉ Gmail!");
            }
            email = request.getEmail().trim().toLowerCase();
            fullName = request.getFullName();
            googleId = request.getGoogleId();
        }

        if (!email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new IllegalArgumentException("Địa chỉ Gmail không đúng định dạng!");
        }

        // 2. Tìm tài khoản trong database
        User user = userRepository.findByEmail(email).orElse(null);

        if (user != null) {
            // Kiểm tra trạng thái khóa tài khoản
            if ("locked".equalsIgnoreCase(user.getStatus())) {
                throw new RuntimeException("Tài khoản của bạn đã bị khóa bởi quản trị viên. Vui lòng liên hệ hỗ trợ!");
            }

            // Cập nhật tên nếu trước đó tài khoản chưa có tên
            if ((user.getFullName() == null || user.getFullName().isBlank()) && fullName != null && !fullName.isBlank()) {
                user.setFullName(fullName);
                user = userRepository.save(user);
            }
        } else {
            // 3. Người dùng đăng nhập lần đầu bằng Google -> Khởi tạo tài khoản Customer mới
            user = new User();
            user.setEmail(email);
            user.setFullName(fullName != null && !fullName.isBlank() ? fullName : email.split("@")[0]);
            user.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
            user.setRole("customer");
            user.setStatus("active");
            user.setCreatedAt(LocalDateTime.now());
            user = userRepository.save(user);

            // Khởi tạo giỏ hàng rỗng cho tài khoản mới
            try {
                if (cartRepository.findByUserId(user.getUserId()).isEmpty()) {
                    Cart newCart = new Cart();
                    newCart.setUser(user);
                    cartRepository.save(newCart);
                }
            } catch (Exception e) {
                log.warn("Không thể tự động tạo giỏ hàng cho tài khoản Google {}: {}", email, e.getMessage());
            }

            // Gửi thông báo chào mừng trong hệ thống
            try {
                notificationService.createNotification(
                        user.getUserId(),
                        "system",
                        "Chào mừng " + user.getFullName() + " đã tham gia Fashion Store qua tài khoản Google!"
                );
            } catch (Exception e) {
                log.warn("Không thể gửi thông báo chào mừng cho tài khoản Google {}: {}", email, e.getMessage());
            }
        }

        // 4. Sinh JWT token hệ thống
        String jwt = jwtUtils.generateTokenFromUser(user);
        String role = user.getRole() != null ? user.getRole().toLowerCase() : "customer";

        return new JwtResponse(jwt, user.getUserId(), user.getEmail(), role, user.getFullName());
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

    /**
     * Gửi mã OTP xác thực đăng nhập Google về Gmail của người dùng.
     */
    public void sendGoogleOtp(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Địa chỉ Gmail không được để trống!");
        }
        email = email.trim().toLowerCase();
        if (!email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new IllegalArgumentException("Địa chỉ Gmail không đúng định dạng!");
        }

        userRepository.findByEmail(email).ifPresent(u -> {
            if ("locked".equalsIgnoreCase(u.getStatus())) {
                throw new RuntimeException("Tài khoản của bạn đã bị khóa bởi quản trị viên!");
            }
        });

        emailService.sendOtpEmail(email);
    }

    /**
     * Đăng nhập Google kết hợp xác thực mã OTP 6 chữ số gửi qua Gmail.
     */
    public JwtResponse googleLoginWithOtp(GoogleLoginRequest request, String otp) {
        if (request == null) {
            throw new IllegalArgumentException("Thông tin yêu cầu không hợp lệ!");
        }
        if (otp == null || otp.trim().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng nhập mã OTP xác thực!");
        }

        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        if (email.isEmpty()) {
            throw new IllegalArgumentException("Địa chỉ Gmail không được để trống!");
        }

        if (!emailService.verifyOtp(email, otp.trim(), true)) {
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
