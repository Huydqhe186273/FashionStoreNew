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
    public List<UserDTO> getUsers(String keyword, String role, String status) {
        List<User> users = userRepository.searchUsers(keyword, role, status);
        return users.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserDTO getUserById(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));
        return mapToDTO(user);
    }

    @Transactional
    public UserDTO updateUser(Integer userId, UpdateUserRequestDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

        if (dto.getFullName() != null && !dto.getFullName().trim().isEmpty()) {
            user.setFullName(dto.getFullName().trim());
        }
        if (dto.getPhone() != null) {
            user.setPhone(dto.getPhone().trim());
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
