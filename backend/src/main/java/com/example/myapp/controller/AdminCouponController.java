package com.example.myapp.controller;

import com.example.myapp.model.CouponDTO;
import com.example.myapp.model.CreateCouponRequestDTO;
import com.example.myapp.service.CouponService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/coupons")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCouponController {

    private final CouponService couponService;

    public AdminCouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @GetMapping
    public ResponseEntity<List<CouponDTO>> getCoupons(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String discountType,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(couponService.getCoupons(keyword, discountType, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CouponDTO> getCouponById(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(couponService.getCouponById(id));
    }

    @PostMapping
    public ResponseEntity<CouponDTO> createCoupon(@RequestBody CreateCouponRequestDTO dto) {
        return new ResponseEntity<>(couponService.createCoupon(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CouponDTO> updateCoupon(
            @PathVariable("id") Integer id,
            @RequestBody CreateCouponRequestDTO dto) {
        return ResponseEntity.ok(couponService.updateCoupon(id, dto));
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<CouponDTO> toggleCouponStatus(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(couponService.toggleCouponStatus(id));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<CouponDTO> patchToggleCouponStatus(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(couponService.toggleCouponStatus(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<CouponDTO> disableCoupon(@PathVariable("id") Integer id) {
        // Soft delete / disable — "Không xóa cứng"
        return ResponseEntity.ok(couponService.disableCoupon(id));
    }
}
