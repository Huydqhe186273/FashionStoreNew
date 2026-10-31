package com.example.myapp.service;

import com.example.myapp.entity.User;
import com.example.myapp.model.CreateStaffRequestDTO;
import com.example.myapp.model.StaffDTO;
import com.example.myapp.repos.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    // Lấy danh sách tài khoản nhân viên/quản trị viên theo các điều kiện lọc.
    public List<StaffDTO> getStaffMembers(String keyword, String role, String status) {
        List<User> users = userRepository.searchUsers(keyword, role, status);
        return users.stream()
                .filter(u -> "staff".equalsIgnoreCase(u.getRole()) || "admin".equalsIgnoreCase(u.getRole()))
                .map(this::mapToStaffDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    // Tạo tài khoản nhân viên hoặc quản trị viên mới với các giá trị mặc định khi cần.
    public StaffDTO createStaff(CreateStaffRequestDTO dto) {
        if (dto.getEmail() == null || dto.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email không được để trống!");
        }
        String cleanEmail = dto.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(cleanEmail)) {
            throw new IllegalArgumentException("Email '" + cleanEmail + "' đã được sử dụng bởi tài khoản khác!");
        }

        if (dto.getPhone() != null && !dto.getPhone().trim().isEmpty()) {
            String cleanPhone = dto.getPhone().trim();
            if (userRepository.existsByPhone(cleanPhone)) {
                throw new IllegalArgumentException("Số điện thoại '" + cleanPhone + "' đã được sử dụng!");
            }
        }

        String rawPassword = (dto.getPassword() != null && !dto.getPassword().trim().isEmpty())
                ? dto.getPassword().trim()
                : "123456";
        if (rawPassword.length() < 6) {
            throw new IllegalArgumentException("Mật khẩu phải có độ dài tối thiểu 6 ký tự!");
        }

        User user = new User();
        user.setFullName(dto.getFullName() != null ? dto.getFullName().trim() : "");
        user.setEmail(cleanEmail);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setPhone(dto.getPhone() != null && !dto.getPhone().trim().isEmpty() ? dto.getPhone().trim() : null);
        user.setRole(dto.getRole() != null ? dto.getRole() : "staff");
        user.setStatus(dto.getStatus() != null ? dto.getStatus() : "active");
        user.setCreatedAt(LocalDateTime.now());

        User saved = userRepository.save(user);
        return mapToStaffDTO(saved);
    }

    @Transactional
    // Cập nhật thông tin tài khoản nhân viên; chỉ đổi mật khẩu khi request có mật khẩu hợp lệ.
    public StaffDTO updateStaff(Integer id, CreateStaffRequestDTO dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhân viên ID: " + id));

        if (dto.getFullName() != null && !dto.getFullName().trim().isEmpty()) {
            user.setFullName(dto.getFullName().trim());
        }

        if (dto.getPhone() != null && !dto.getPhone().trim().isEmpty()) {
            String cleanPhone = dto.getPhone().trim();
            if (userRepository.existsByPhoneAndUserIdNot(cleanPhone, id)) {
                throw new IllegalArgumentException("Số điện thoại '" + cleanPhone + "' đã được sử dụng bởi người dùng khác!");
            }
            user.setPhone(cleanPhone);
        }

        if (dto.getRole() != null && !dto.getRole().trim().isEmpty()) {
            user.setRole(dto.getRole().trim());
        }

        if (dto.getStatus() != null && !dto.getStatus().trim().isEmpty()) {
            user.setStatus(dto.getStatus().trim());
        }

        if (dto.getPassword() != null && !dto.getPassword().trim().isEmpty()) {
            String cleanPwd = dto.getPassword().trim();
            if (cleanPwd.length() < 6) {
                throw new IllegalArgumentException("Mật khẩu mới phải có ít nhất 6 ký tự!");
            }
            user.setPasswordHash(passwordEncoder.encode(cleanPwd));
        }

        User saved = userRepository.save(user);
        return mapToStaffDTO(saved);
    }

    // Chuyển entity User thành StaffDTO để không trả về password hash.
    private StaffDTO mapToStaffDTO(User u) {
        return StaffDTO.builder()
                .userId(u.getUserId())
                .fullName(u.getFullName())
                .email(u.getEmail())
                .phone(u.getPhone())
                .role(u.getRole())
                .status(u.getStatus())
                .createdAt(u.getCreatedAt())
                .build();
    }
}
