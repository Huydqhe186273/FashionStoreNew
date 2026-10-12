package com.example.myapp.service;

import com.example.myapp.entity.Notification;
import com.example.myapp.entity.User;
import com.example.myapp.repos.NotificationRepository;
import com.example.myapp.repos.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public void createNotification(Integer userId, String type, String content) {
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            Notification notification = new Notification();
            notification.setUser(user);
            notification.setType(type);
            notification.setContent(content);
            notification.setIsRead(false);
            notification.setCreatedAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }
    }

    @Transactional(readOnly = true)
    public List<Notification> getNotificationsByUserId(Integer userId) {
        return notificationRepository.findByUserUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public void markAsRead(Integer notificationId) {
        Notification notification = notificationRepository.findById(notificationId).orElse(null);
        if (notification != null) {
            notification.setIsRead(true);
            notificationRepository.save(notification);
        }
    }

    @Transactional
    public void markAllAsRead(Integer userId) {
        List<Notification> list = notificationRepository.findByUserUserIdOrderByCreatedAtDesc(userId);
        for (Notification n : list) {
            if (!Boolean.TRUE.equals(n.getIsRead())) {
                n.setIsRead(true);
                notificationRepository.save(n);
            }
        }
    }
}
