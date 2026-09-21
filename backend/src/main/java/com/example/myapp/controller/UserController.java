package com.example.myapp.controller;

import com.example.myapp.model.UpdateUserRequestDTO;
import com.example.myapp.model.UserDTO;
import com.example.myapp.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/manager/users")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    // Xử lý GET /api/manager/users để trả danh sách người dùng đã lọc.
    public ResponseEntity<List<UserDTO>> getUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status) {
        List<UserDTO> users = userService.getUsers(keyword, role, status);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    // Xử lý GET /api/manager/users/{id} để trả thông tin một người dùng.
    public ResponseEntity<UserDTO> getUserById(@PathVariable("id") Integer id) {
        UserDTO user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/{id}")
    // Xử lý PUT /api/manager/users/{id} để cập nhật thông tin người dùng.
    public ResponseEntity<UserDTO> updateUser(
            @PathVariable("id") Integer id,
            @RequestBody UpdateUserRequestDTO dto) {
        UserDTO updated = userService.updateUser(id, dto);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/lock")
    // Xử lý PUT /api/manager/users/{id}/lock để khóa hoặc mở khóa tài khoản.
    public ResponseEntity<UserDTO> toggleUserLock(@PathVariable("id") Integer id) {
        UserDTO updated = userService.toggleUserLock(id);
        return ResponseEntity.ok(updated);
    }
}
