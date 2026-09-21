package com.example.myapp.repos;

import com.example.myapp.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Integer> {

    List<Favorite> findByUser_UserIdOrderByCreatedAtDesc(Integer userId);

    Optional<Favorite> findByUser_UserIdAndProduct_ProductId(Integer userId, Integer productId);

    boolean existsByUser_UserIdAndProduct_ProductId(Integer userId, Integer productId);

    long countByUser_UserId(Integer userId);

    @Modifying
    @Query("DELETE FROM Favorite f WHERE f.User.UserId = :userId AND f.Product.ProductId = :productId")
    int deleteByUserAndProduct(@Param("userId") Integer userId, @Param("productId") Integer productId);
}
