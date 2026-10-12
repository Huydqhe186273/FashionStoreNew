package com.example.myapp.repos;

import com.example.myapp.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    List<Notification> findByUserUserIdOrderByCreatedAtDesc(Integer userId);
}
