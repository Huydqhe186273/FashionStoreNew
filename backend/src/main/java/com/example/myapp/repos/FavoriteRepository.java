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

    // Spring Data can't derive `findByUser_UserId` because the User entity
    // has `UserId`, not `id`. Use explicit JPQL instead.

    @Query("SELECT f FROM Favorite f WHERE f.User.UserId = :userId ORDER BY f.CreatedAt DESC")
    List<Favorite> findFavoritesByUserOrderByCreatedAtDesc(@Param("userId") Integer userId);

    @Query("SELECT f FROM Favorite f WHERE f.User.UserId = :userId AND f.Product.ProductId = :productId")
    Optional<Favorite> findFavoriteByUserAndProduct(@Param("userId") Integer userId, @Param("productId") Integer productId);

    @Query("SELECT COUNT(f) > 0 FROM Favorite f WHERE f.User.UserId = :userId AND f.Product.ProductId = :productId")
    boolean existsFavoriteByUserAndProduct(@Param("userId") Integer userId, @Param("productId") Integer productId);

    @Query("SELECT COUNT(f) FROM Favorite f WHERE f.User.UserId = :userId")
    long countFavoritesByUser(@Param("userId") Integer userId);

    @Modifying
    @Query("DELETE FROM Favorite f WHERE f.User.UserId = :userId AND f.Product.ProductId = :productId")
    int deleteByUserAndProduct(@Param("userId") Integer userId, @Param("productId") Integer productId);
}
