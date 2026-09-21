package com.example.myapp.repos;

import com.example.myapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    @Query("SELECT u FROM User u WHERE u.Email = :email")
    Optional<User> findByEmail(@Param("email") String email);

    @Query("SELECT COUNT(u) > 0 FROM User u WHERE u.Email = :email")
    boolean existsByEmail(@Param("email") String email);

    @Query("SELECT COUNT(u) FROM User u WHERE u.Role = :role")
    long countByRole(@Param("role") String role);

    @Query("SELECT COUNT(u) FROM User u WHERE u.Status = :status")
    long countByStatus(@Param("status") String status);

    @Query("SELECT u FROM User u ORDER BY u.CreatedAt DESC LIMIT 5")
    List<User> findTop5ByOrderByCreatedAtDesc();

    @Query("SELECT u FROM User u WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR LOWER(u.FullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(u.Email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(u.Phone) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:role IS NULL OR :role = '' OR u.Role = :role) AND " +
           "(:status IS NULL OR :status = '' OR u.Status = :status) " +
           "ORDER BY u.CreatedAt DESC")
    List<User> searchUsers(@Param("keyword") String keyword, @Param("role") String role, @Param("status") String status);
}
