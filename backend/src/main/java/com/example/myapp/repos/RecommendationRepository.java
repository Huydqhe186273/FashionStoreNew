package com.example.myapp.repos;

import com.example.myapp.entity.Recommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecommendationRepository extends JpaRepository<Recommendation, Integer> {
    List<Recommendation> findByUserUserIdOrderByCreatedAtDesc(Integer userId);
    List<Recommendation> findBySessionIdOrderByCreatedAtDesc(String sessionId);
    void deleteByUserUserId(Integer userId);
}
