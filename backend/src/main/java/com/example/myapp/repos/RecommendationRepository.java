package com.example.myapp.repos;

import com.example.myapp.entity.Recommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface RecommendationRepository extends JpaRepository<Recommendation, Integer> {
    @Query("SELECT r FROM Recommendation r WHERE r.User.UserId = :userId ORDER BY r.CreatedAt DESC")
    List<Recommendation> findByUserUserIdOrderByCreatedAtDesc(@Param("userId") Integer userId);

    @Query("SELECT r FROM Recommendation r WHERE r.SessionId = :sessionId ORDER BY r.CreatedAt DESC")
    List<Recommendation> findBySessionIdOrderByCreatedAtDesc(@Param("sessionId") String sessionId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Recommendation r WHERE r.User.UserId = :userId")
    void deleteByUserUserId(@Param("userId") Integer userId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Recommendation r WHERE r.SessionId = :sessionId")
    void deleteBySessionId(@Param("sessionId") String sessionId);
}
