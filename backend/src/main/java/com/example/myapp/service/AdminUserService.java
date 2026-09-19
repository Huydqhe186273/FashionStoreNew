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

    @Transactional(readOnly = true)
    public List<StaffDTO> getStaffMembers(String keyword, String role, String status) {
        List<User> users = userRepository.searchUsers(keyword, role, status);
        return users.stream()
                .filter(u -> "staff".equalsIgnoreCase(u.getRole()) || "admin".equalsIgnoreCase(u.getRole()))
                .map(this::mapToStaffDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public StaffDTO createStaff(CreateStaffRequestDTO dto) {
        User user = new User();
        user.setFullName(dto.getFullName());
        user.setEmail(dto.getEmail());
        user.setPasswordHash(dto.getPassword() != null ? dto.getPassword() : "hashed_password");
        user.setPhone(dto.getPhone());
        user.setRole(dto.getRole() != null ? dto.getRole() : "staff");
        user.setStatus(dto.getStatus() != null ? dto.getStatus() : "active");
        user.setCreatedAt(LocalDateTime.now());

        User saved = userRepository.save(user);
        return mapToStaffDTO(saved);
    }

    @Transactional
    public StaffDTO updateStaff(Integer id, CreateStaffRequestDTO dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhân viên ID: " + id));

        if (dto.getFullName() != null) user.setFullName(dto.getFullName());
        if (dto.getPhone() != null) user.setPhone(dto.getPhone());
        if (dto.getRole() != null) user.setRole(dto.getRole());
        if (dto.getStatus() != null) user.setStatus(dto.getStatus());
        if (dto.getPassword() != null && !dto.getPassword().trim().isEmpty()) {
            user.setPasswordHash(dto.getPassword().trim());
        }

        User saved = userRepository.save(user);
        return mapToStaffDTO(saved);
    }

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
