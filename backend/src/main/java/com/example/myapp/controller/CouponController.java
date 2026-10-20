package com.example.myapp.controller;

import com.example.myapp.model.ApplyCouponRequestDTO;
import com.example.myapp.model.ApplyCouponResponseDTO;
import com.example.myapp.model.DiscountCodeDTO;
import com.example.myapp.service.DiscountCodeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/coupons")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class CouponController {

    private final DiscountCodeService discountCodeService;

    @GetMapping("/active")
    public ResponseEntity<List<DiscountCodeDTO>> getActiveCoupons() {
        return ResponseEntity.ok(discountCodeService.getActiveCoupons());
    }

    @PostMapping("/apply")
    public ResponseEntity<ApplyCouponResponseDTO> applyCoupon(@RequestBody ApplyCouponRequestDTO request) {
        ApplyCouponResponseDTO response = discountCodeService.validateAndApplyCoupon(
                request.getCode(), request.getOrderTotal());
        return ResponseEntity.ok(response);
    }
}
