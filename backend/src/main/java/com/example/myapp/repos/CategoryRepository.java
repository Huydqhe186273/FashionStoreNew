package com.example.myapp.repos;

import com.example.myapp.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Integer> {

    @Query("SELECT c FROM Category c WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR LOWER(c.Name) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:gender IS NULL OR :gender = '' OR LOWER(c.Gender) = LOWER(:gender)) " +
           "ORDER BY c.CategoryId DESC")
    List<Category> searchCategories(@Param("keyword") String keyword, @Param("gender") String gender);
}
