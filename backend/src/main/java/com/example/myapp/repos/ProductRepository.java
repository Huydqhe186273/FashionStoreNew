package com.example.myapp.repos;

import com.example.myapp.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {

    @Query("SELECT COUNT(p) FROM Product p WHERE p.Status = :status")
    long countByStatus(@Param("status") String status);

    @Query("SELECT p FROM Product p ORDER BY p.SoldCount DESC LIMIT 5")
    List<Product> findTop5ByOrderBySoldCountDesc();

    @Query("SELECT p FROM Product p ORDER BY p.SoldCount DESC LIMIT 10")
    List<Product> findTop10ByOrderBySoldCountDesc();

    @Query("SELECT COALESCE(SUM(pv.StockQuantity), 0) FROM ProductVariant pv")
    long sumTotalStockQuantity();

    @Query("SELECT p FROM Product p WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR LOWER(p.Name) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:categoryId IS NULL OR p.Category.CategoryId = :categoryId) AND " +
           "(:status IS NULL OR :status = '' OR p.Status = :status) " +
           "ORDER BY p.CreatedAt DESC")
    List<Product> searchProducts(@Param("keyword") String keyword, @Param("categoryId") Integer categoryId, @Param("status") String status);
}
