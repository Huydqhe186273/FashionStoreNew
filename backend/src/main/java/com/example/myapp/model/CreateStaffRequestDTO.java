package com.example.myapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateStaffRequestDTO {
    private String fullName;
    private String email;
    private String password;
    private String phone;
    private String role; // "staff" or "admin"
    private String status; // "active" or "locked"
}
