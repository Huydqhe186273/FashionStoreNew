package com.example.myapp.rest;

import com.example.myapp.model.CreateStaffRequestDTO;
import com.example.myapp.model.StaffDTO;
import com.example.myapp.model.UpdateUserRequestDTO;
import com.example.myapp.model.UserDTO;
import com.example.myapp.service.AdminUserService;
import com.example.myapp.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserService userService;
    private final AdminUserService adminUserService;

    // --- CUSTOMERS MANAGEMENT ---
    @GetMapping("/users")
    public ResponseEntity<List<UserDTO>> getUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(userService.getUsers(keyword, "customer", status));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<UserDTO> updateUser(
            @PathVariable("id") Integer id,
            @RequestBody UpdateUserRequestDTO dto) {
        return ResponseEntity.ok(userService.updateUser(id, dto));
    }

    @PutMapping("/users/{id}/lock")
    public ResponseEntity<UserDTO> toggleUserLock(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(userService.toggleUserLock(id));
    }

    // --- STAFF MANAGEMENT ---
    @GetMapping("/staff")
    public ResponseEntity<List<StaffDTO>> getStaffMembers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(adminUserService.getStaffMembers(keyword, role, status));
    }

    @PostMapping("/staff")
    public ResponseEntity<StaffDTO> createStaff(@RequestBody CreateStaffRequestDTO dto) {
        return ResponseEntity.ok(adminUserService.createStaff(dto));
    }

    @PutMapping("/staff/{id}")
    public ResponseEntity<StaffDTO> updateStaff(
            @PathVariable("id") Integer id,
            @RequestBody CreateStaffRequestDTO dto) {
        return ResponseEntity.ok(adminUserService.updateStaff(id, dto));
    }

    @PutMapping("/staff/{id}/lock")
    public ResponseEntity<UserDTO> toggleStaffLock(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(userService.toggleUserLock(id));
    }
}
