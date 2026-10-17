package com.example.myapp.repos;

import com.example.myapp.entity.UserBehaviorLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserBehaviorLogRepository extends JpaRepository<UserBehaviorLog, Long> {
    List<UserBehaviorLog> findByUserUserIdOrderByCreatedAtDesc(Integer userId);
    List<UserBehaviorLog> findTop100ByUserUserIdOrderByCreatedAtDesc(Integer userId);
    List<UserBehaviorLog> findBySessionIdOrderByCreatedAtDesc(String sessionId);
    List<UserBehaviorLog> findTop100BySessionIdOrderByCreatedAtDesc(String sessionId);
}
