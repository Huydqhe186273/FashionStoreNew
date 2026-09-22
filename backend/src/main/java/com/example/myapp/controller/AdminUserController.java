package com.example.myapp.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.myapp.model.CreateStaffRequestDTO;
import com.example.myapp.model.StaffDTO;
import com.example.myapp.model.UpdateUserRequestDTO;
import com.example.myapp.model.UserDTO;
import com.example.myapp.service.AdminUserService;
import com.example.myapp.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserService userService;
    private final AdminUserService adminUserService;

    // --- CUSTOMERS MANAGEMENT ---
    @GetMapping("/users")
    //Xử lý GET /api/admin/users; chỉ lấy người dùng có vai trò customer.
    public ResponseEntity<List<UserDTO>> getUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(userService.getUsers(keyword, "customer", status));
    }

    @PutMapping("/users/{id}")
    // Xử lý PUT /api/admin/users/{id} để cập nhật tài khoản khách hàng.
    public ResponseEntity<UserDTO> updateUser(
            @PathVariable("id") Integer id,
            @RequestBody UpdateUserRequestDTO dto) {
        return ResponseEntity.ok(userService.updateUser(id, dto));
    }

    @PutMapping("/users/{id}/lock")
    // Xử lý PUT /api/admin/users/{id}/lock để khóa hoặc mở khóa khách hàng.
    public ResponseEntity<UserDTO> toggleUserLock(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(userService.toggleUserLock(id));
    }

    // --- STAFF MANAGEMENT ---
    @GetMapping("/staff")
    // Xử lý GET /api/admin/staff để lấy danh sách nhân viên và quản trị viên.
    public ResponseEntity<List<StaffDTO>> getStaffMembers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(adminUserService.getStaffMembers(keyword, role, status));
    }

    @PostMapping("/staff")
    // Xử lý POST /api/admin/staff để tạo tài khoản nhân viên.
    public ResponseEntity<StaffDTO> createStaff(@RequestBody CreateStaffRequestDTO dto) {
        return ResponseEntity.ok(adminUserService.createStaff(dto));
    }

    @PutMapping("/staff/{id}")
    // Xử lý PUT /api/admin/staff/{id} để cập nhật thông tin nhân viên.
    public ResponseEntity<StaffDTO> updateStaff(
            @PathVariable("id") Integer id,
            @RequestBody CreateStaffRequestDTO dto) {
        return ResponseEntity.ok(adminUserService.updateStaff(id, dto));
    }

    @PutMapping("/staff/{id}/lock")
    // Xử lý PUT /api/admin/staff/{id}/lock để khóa hoặc mở khóa tài khoản nhân viên.
    public ResponseEntity<UserDTO> toggleStaffLock(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(userService.toggleUserLock(id));
    }
}
