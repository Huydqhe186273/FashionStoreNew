package com.example.myapp.repos;

import com.example.myapp.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    @Query("SELECT n FROM Notification n WHERE n.User.UserId = :userId ORDER BY n.CreatedAt DESC")
    List<Notification> findByUserUserIdOrderByCreatedAtDesc(@Param("userId") Integer userId);
}
