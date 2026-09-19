package com.example.myapp.repos;

import com.example.myapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    long countByRole(String role);

    long countByStatus(String status);

    List<User> findTop5ByOrderByCreatedAtDesc();

    @Query("SELECT u FROM User u WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR LOWER(u.FullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(u.Email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(u.Phone) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:role IS NULL OR :role = '' OR u.Role = :role) AND " +
           "(:status IS NULL OR :status = '' OR u.Status = :status) " +
           "ORDER BY u.CreatedAt DESC")
    List<User> searchUsers(@Param("keyword") String keyword, @Param("role") String role, @Param("status") String status);
}
