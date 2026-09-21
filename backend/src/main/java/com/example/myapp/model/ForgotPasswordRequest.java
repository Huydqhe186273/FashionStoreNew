package com.example.myapp.model;

import lombok.Data;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Data
public class ForgotPasswordRequest {
    @NotBlank
    @Email
    private String email;
}
