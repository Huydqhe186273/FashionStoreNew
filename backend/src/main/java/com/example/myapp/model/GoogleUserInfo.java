package com.example.myapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoogleUserInfo {
    private String email;
    private String name;
    private String googleId;
    private String picture;
    private boolean emailVerified;
}

