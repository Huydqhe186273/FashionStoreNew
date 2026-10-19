package com.example.myapp.repos;

import com.example.myapp.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Integer> {

    @Modifying
    @Query("DELETE FROM CartItem ci WHERE ci.Variant.VariantId = :variantId")
    void deleteByVariantId(@Param("variantId") Integer variantId);
}

