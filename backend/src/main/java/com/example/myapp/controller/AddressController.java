package com.example.myapp.controller;

import com.example.myapp.entity.Address;
import com.example.myapp.entity.User;
import com.example.myapp.repos.AddressRepository;
import com.example.myapp.repos.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/addresses")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AddressController {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> createAddress(@RequestParam Integer userId, @RequestBody Address address) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            address.setUser(user);
            // Mặc định không phải là địa chỉ mặc định nếu chưa có
            if (address.getIsDefault() == null) {
                address.setIsDefault(false);
            }

            Address saved = addressRepository.save(address);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
