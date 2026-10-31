package com.example.myapp.service;

import com.example.myapp.entity.User;
import com.example.myapp.model.UpdateUserRequestDTO;
import com.example.myapp.model.UserDTO;
import com.example.myapp.repos.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    // Lấy danh sách người dùng, có thể lọc theo từ khóa, vai trò và trạng thái.
    public List<UserDTO> getUsers(String keyword, String role, String status) {
        List<User> users = userRepository.searchUsers(keyword, role, status);
        return users.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    // Tìm một người dùng theo ID và chuyển dữ liệu entity sang DTO để trả về API.
    public UserDTO getUserById(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));
        return mapToDTO(user);
    }

    @Transactional
    // Tạo mới tài khoản khách hàng từ trang quản trị.
    public UserDTO createUser(UpdateUserRequestDTO dto) {
        String fullName = com.example.myapp.util.UserValidationUtils.validateAndNormalizeFullName(
                dto.getFullName() != null && !dto.getFullName().trim().isEmpty() ? dto.getFullName() : "Khách hàng mới"
        );
        String email = com.example.myapp.util.UserValidationUtils.validateAndNormalizeEmail(dto.getEmail());
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email '" + email + "' đã tồn tại trong hệ thống");
        }

        String phone = com.example.myapp.util.UserValidationUtils.validateAndNormalizePhone(dto.getPhone(), false);
        if (phone != null && userRepository.existsByPhone(phone)) {
            throw new IllegalArgumentException("Số điện thoại '" + phone + "' đã tồn tại trong hệ thống!");
        }

        String role = com.example.myapp.util.UserValidationUtils.validateAndNormalizeRole(dto.getRole());
        String status = com.example.myapp.util.UserValidationUtils.validateAndNormalizeStatus(dto.getStatus());

        User user = new User();
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPhone(phone);
        user.setPasswordHash("admin123");
        user.setRole(role);
        user.setStatus(status);
        user.setCreatedAt(java.time.LocalDateTime.now());

        User saved = userRepository.save(user);
        return mapToDTO(saved);
    }

    @Transactional
    // Cập nhật các trường được cung cấp của người dùng có ID tương ứng.
    public UserDTO updateUser(Integer userId, UpdateUserRequestDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

        if (dto.getFullName() != null) {
            user.setFullName(com.example.myapp.util.UserValidationUtils.validateAndNormalizeFullName(dto.getFullName()));
        }
        if (dto.getPhone() != null) {
            String phone = com.example.myapp.util.UserValidationUtils.validateAndNormalizePhone(dto.getPhone(), false);
            if (phone != null) {
                if (!phone.equals(user.getPhone())) {
                    if (userRepository.existsByPhoneAndUserIdNot(phone, userId)) {
                        throw new IllegalArgumentException("Số điện thoại '" + phone + "' đã được sử dụng bởi người dùng khác!");
                    }
                }
                user.setPhone(phone);
            } else {
                user.setPhone(null);
            }
        }
        if (dto.getEmail() != null) {
            String email = com.example.myapp.util.UserValidationUtils.validateAndNormalizeEmail(dto.getEmail());
            if (!email.equalsIgnoreCase(user.getEmail())) {
                if (userRepository.existsByEmailAndUserIdNot(email, userId)) {
                    throw new IllegalArgumentException("Email '" + email + "' đã được sử dụng bởi người dùng khác!");
                }
            }
            user.setEmail(email);
        }
        if (dto.getRole() != null) {
            user.setRole(com.example.myapp.util.UserValidationUtils.validateAndNormalizeRole(dto.getRole()));
        }
        if (dto.getStatus() != null) {
            user.setStatus(com.example.myapp.util.UserValidationUtils.validateAndNormalizeStatus(dto.getStatus()));
        }

        User updatedUser = userRepository.save(user);
        return mapToDTO(updatedUser);
    }

    @Transactional
    // Đảo trạng thái tài khoản giữa active và locked.
    public UserDTO toggleUserLock(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng với ID: " + userId));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null && auth.getName().equalsIgnoreCase(user.getEmail())) {
            throw new IllegalArgumentException("Không thể tự khóa tài khoản của chính bạn đang đăng nhập!");
        }

        if ("locked".equalsIgnoreCase(user.getStatus())) {
            user.setStatus("active");
        } else {
            user.setStatus("locked");
        }

        User updatedUser = userRepository.save(user);
        return mapToDTO(updatedUser);
    }

    // Chuyển entity User thành UserDTO, gồm cả tổng số đơn hàng của người dùng.
    private UserDTO mapToDTO(User user) {
        long orderCount = user.getOrders() != null ? user.getOrders().size() : 0;
        return UserDTO.builder()
                .userId(user.getUserId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .totalOrders(orderCount)
                .build();
    }
}
