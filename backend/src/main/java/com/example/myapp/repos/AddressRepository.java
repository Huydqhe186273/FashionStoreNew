package com.example.myapp.repos;

import com.example.myapp.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AddressRepository extends JpaRepository<Address, Integer> {
    
    @Query("SELECT a FROM Address a WHERE a.User.UserId = :userId")
    List<Address> findByUserId(@Param("userId") Integer userId);
}
