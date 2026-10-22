package com.example.myapp.model;

import lombok.Data;

@Data
public class GoogleLoginRequest {
    private String email;
    private String fullName;
    private String googleId;
}
