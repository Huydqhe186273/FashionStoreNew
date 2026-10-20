package com.example.myapp.model;

import lombok.Data;

@Data
public class RegisterWithOtpRequest {
    private String fullName;
    private String email;
    private String password;
    private String otp;
}
