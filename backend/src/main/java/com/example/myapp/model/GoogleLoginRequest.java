package com.example.myapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoogleLoginRequest {
    private String email;
    private String fullName;
    private String googleId;
    private String idToken;      // Google OAuth2 ID Token (JWT) từ Google Identity Services
    private String credential;   // Alias của idToken thường trả về từ Google GSI
}
