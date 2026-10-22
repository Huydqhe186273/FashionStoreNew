package com.example.myapp.repos;

import com.example.myapp.entity.UserBehaviorLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserBehaviorLogRepository extends JpaRepository<UserBehaviorLog, Long> {
    @Query("SELECT l FROM UserBehaviorLog l WHERE l.User.UserId = :userId ORDER BY l.CreatedAt DESC")
    List<UserBehaviorLog> findByUserUserIdOrderByCreatedAtDesc(@Param("userId") Integer userId);

    @Query("SELECT l FROM UserBehaviorLog l WHERE l.User.UserId = :userId ORDER BY l.CreatedAt DESC")
    List<UserBehaviorLog> findTop100ByUserUserIdOrderByCreatedAtDesc(@Param("userId") Integer userId);

    @Query("SELECT l FROM UserBehaviorLog l WHERE l.SessionId = :sessionId ORDER BY l.CreatedAt DESC")
    List<UserBehaviorLog> findBySessionIdOrderByCreatedAtDesc(@Param("sessionId") String sessionId);

    @Query("SELECT l FROM UserBehaviorLog l WHERE l.SessionId = :sessionId ORDER BY l.CreatedAt DESC")
    List<UserBehaviorLog> findTop100BySessionIdOrderByCreatedAtDesc(@Param("sessionId") String sessionId);
}
