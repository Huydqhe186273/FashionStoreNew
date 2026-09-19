package com.example.myapp.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "Fashion Store API Documentation",
                version = "1.0.0",
                description = "REST API documentation for Fashion Store Admin & Management endpoints",
                contact = @Contact(name = "FashionStore Team")
        )
)
public class OpenApiConfig {
}
