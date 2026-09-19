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
    public ResponseEntity<List<UserDTO>> getUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status) {
        List<UserDTO> users = userService.getUsers(keyword, role, status);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable("id") Integer id) {
        UserDTO user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> updateUser(
            @PathVariable("id") Integer id,
            @RequestBody UpdateUserRequestDTO dto) {
        UserDTO updated = userService.updateUser(id, dto);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/lock")
    public ResponseEntity<UserDTO> toggleUserLock(@PathVariable("id") Integer id) {
        UserDTO updated = userService.toggleUserLock(id);
        return ResponseEntity.ok(updated);
    }
}
