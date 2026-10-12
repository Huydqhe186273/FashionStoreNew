package com.example.myapp.controller;

import com.example.myapp.entity.Notification;
import com.example.myapp.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(@RequestParam Integer userId) {
        return ResponseEntity.ok(notificationService.getNotificationsByUserId(userId));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Integer id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(Map.of("message", "Đã đánh dấu thông báo là đã đọc"));
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(@RequestParam Integer userId) {
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(Map.of("message", "Đã đánh dấu tất cả thông báo là đã đọc"));
    }
}
