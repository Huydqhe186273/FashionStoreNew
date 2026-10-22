package com.example.myapp.controller;

import com.example.myapp.entity.Address;
import com.example.myapp.entity.User;
import com.example.myapp.repos.AddressRepository;
import com.example.myapp.repos.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/addresses")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AddressController {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getAddresses(@RequestParam Integer userId) {
        try {
            return ResponseEntity.ok(addressRepository.findByUserId(userId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createAddress(@RequestParam Integer userId, @RequestBody Address address) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            List<Address> existing = addressRepository.findByUserId(userId);
            boolean makeDefault = Boolean.TRUE.equals(address.getIsDefault()) || existing.isEmpty();

            if (makeDefault) {
                for (Address a : existing) {
                    if (Boolean.TRUE.equals(a.getIsDefault())) {
                        a.setIsDefault(false);
                        addressRepository.save(a);
                    }
                }
            }

            address.setUser(user);
            address.setIsDefault(makeDefault);

            Address saved = addressRepository.save(address);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAddress(
            @PathVariable("id") Integer id,
            @RequestParam Integer userId,
            @RequestBody Address updatedData) {
        try {
            Address address = addressRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy địa chỉ"));

            if (address.getUser() == null || !address.getUser().getUserId().equals(userId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Không có quyền sửa địa chỉ này"));
            }

            address.setRecipientName(updatedData.getRecipientName());
            address.setPhone(updatedData.getPhone());
            address.setAddressLine(updatedData.getAddressLine());
            address.setCity(updatedData.getCity());

            if (Boolean.TRUE.equals(updatedData.getIsDefault())) {
                List<Address> existing = addressRepository.findByUserId(userId);
                for (Address a : existing) {
                    if (!a.getAddressId().equals(id) && Boolean.TRUE.equals(a.getIsDefault())) {
                        a.setIsDefault(false);
                        addressRepository.save(a);
                    }
                }
                address.setIsDefault(true);
            }

            Address saved = addressRepository.save(address);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAddress(@PathVariable("id") Integer id, @RequestParam Integer userId) {
        try {
            Address address = addressRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy địa chỉ"));

            if (address.getUser() == null || !address.getUser().getUserId().equals(userId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Không có quyền xóa địa chỉ này"));
            }

            boolean wasDefault = Boolean.TRUE.equals(address.getIsDefault());
            addressRepository.delete(address);

            // Nếu vừa xóa địa chỉ mặc định, tự động gán địa chỉ còn lại đầu tiên làm mặc định
            if (wasDefault) {
                List<Address> remaining = addressRepository.findByUserId(userId);
                if (!remaining.isEmpty()) {
                    Address newDefault = remaining.get(0);
                    newDefault.setIsDefault(true);
                    addressRepository.save(newDefault);
                }
            }

            return ResponseEntity.ok(Map.of("message", "Đã xóa địa chỉ thành công"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/default")
    public ResponseEntity<?> setDefaultAddress(@PathVariable("id") Integer id, @RequestParam Integer userId) {
        try {
            Address target = addressRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy địa chỉ"));

            if (target.getUser() == null || !target.getUser().getUserId().equals(userId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Không có quyền thao tác địa chỉ này"));
            }

            List<Address> userAddresses = addressRepository.findByUserId(userId);
            for (Address a : userAddresses) {
                if (a.getAddressId().equals(id)) {
                    a.setIsDefault(true);
                } else if (Boolean.TRUE.equals(a.getIsDefault())) {
                    a.setIsDefault(false);
                }
                addressRepository.save(a);
            }

            return ResponseEntity.ok(Map.of("message", "Đã đặt làm địa chỉ mặc định"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
