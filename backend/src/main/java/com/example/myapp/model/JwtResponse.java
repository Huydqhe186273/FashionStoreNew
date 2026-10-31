package com.example.myapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JwtResponse {
    private String token;
    private Integer id;
    private String email;
    private String role;
    private String fullName;

    public JwtResponse(String token, Integer id, String email, String role) {
        this.token = token;
        this.id = id;
        this.email = email;
        this.role = role;
    }
}
