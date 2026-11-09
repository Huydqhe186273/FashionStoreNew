package com.example.myapp.repos;

import com.example.myapp.entity.UserBehaviorLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UserBehaviorLogRepository extends JpaRepository<UserBehaviorLog, Long> {

    /**
     * 100 hành vi gần nhất của user đã đăng nhập (kể cả các hành vi lúc còn là khách
     * trong cùng sessionId), chỉ lấy trong khoảng thời gian {@code since}.
     */
    @Query("SELECT l FROM UserBehaviorLog l JOIN FETCH l.Product p JOIN FETCH p.Category c " +
           "WHERE (l.User.UserId = :userId OR (:sessionId IS NOT NULL AND l.SessionId = :sessionId)) " +
           "AND l.CreatedAt >= :since ORDER BY l.CreatedAt DESC LIMIT 100")
    List<UserBehaviorLog> findRecentByUser(@Param("userId") Integer userId,
                                           @Param("sessionId") String sessionId,
                                           @Param("since") LocalDateTime since);

    /** 100 hành vi gần nhất của khách vãng lai theo sessionId. */
    @Query("SELECT l FROM UserBehaviorLog l JOIN FETCH l.Product p JOIN FETCH p.Category c " +
           "WHERE l.SessionId = :sessionId AND l.CreatedAt >= :since ORDER BY l.CreatedAt DESC LIMIT 100")
    List<UserBehaviorLog> findRecentBySession(@Param("sessionId") String sessionId,
                                              @Param("since") LocalDateTime since);

    @Modifying
    @Transactional
    @Query("DELETE FROM UserBehaviorLog l WHERE l.User.UserId = :userId")
    void deleteByUserUserId(@Param("userId") Integer userId);

    @Modifying
    @Transactional
    @Query("DELETE FROM UserBehaviorLog l WHERE l.SessionId = :sessionId")
    void deleteBySessionId(@Param("sessionId") String sessionId);
}
