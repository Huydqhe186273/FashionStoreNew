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

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

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
    // Cập nhật các trường được cung cấp của người dùng có ID tương ứng.
    public UserDTO updateUser(Integer userId, UpdateUserRequestDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

        if (dto.getFullName() != null && !dto.getFullName().trim().isEmpty()) {
            user.setFullName(dto.getFullName().trim());
        }
        if (dto.getPhone() != null) {
            user.setPhone(dto.getPhone().trim());
        }
        if (dto.getEmail() != null && !dto.getEmail().trim().equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmail(dto.getEmail().trim())) {
                throw new RuntimeException("Email is already in use");
            }
            user.setEmail(dto.getEmail().trim().toLowerCase());
        }
        if (dto.getRole() != null && !dto.getRole().trim().isEmpty()) {
            user.setRole(dto.getRole().trim().toLowerCase());
        }
        if (dto.getStatus() != null && !dto.getStatus().trim().isEmpty()) {
            user.setStatus(dto.getStatus().trim().toLowerCase());
        }

        User updatedUser = userRepository.save(user);
        return mapToDTO(updatedUser);
    }

    @Transactional
    // Đảo trạng thái tài khoản giữa active và locked.
    public UserDTO toggleUserLock(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

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
