package com.example.myapp.controller;

import com.example.myapp.model.BehaviorLogRequestDTO;
import com.example.myapp.security.CustomUserDetails;
import com.example.myapp.service.TrackingService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class TrackingController {

    private final TrackingService trackingService;

    @PostMapping({"/tracking/log", "/behavior/log"})
    public ResponseEntity<?> logBehavior(@AuthenticationPrincipal CustomUserDetails user,
                                         @RequestBody BehaviorLogRequestDTO request) {
        try {
            // Không tin userId do client gửi lên: lấy từ JWT, khách vãng lai thì để null
            request.setUserId(user != null ? user.getId() : null);
            trackingService.logBehavior(request);
            return ResponseEntity.ok(Map.of("success", true, "message", "Behavior tracked successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", "Tracking error: " + e.getMessage()));
        }
    }
}
