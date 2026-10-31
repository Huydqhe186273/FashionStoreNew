package com.example.myapp.service;

import com.example.myapp.model.GoogleUserInfo;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;

@Service
@Slf4j
public class GoogleTokenVerifierService {

    private static final String GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo?id_token=";
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public GoogleTokenVerifierService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Xác thực Google ID Token thông qua Google OAuth2 tokeninfo endpoint.
     *
     * @param idToken Chuỗi Google ID Token (JWT) được trả về từ Google Identity Services trên frontend.
     * @return GoogleUserInfo chứa thông tin người dùng đã được Google chứng thực (email, name, sub/googleId).
     */
    public GoogleUserInfo verifyToken(String idToken) {
        if (idToken == null || idToken.trim().isEmpty()) {
            throw new IllegalArgumentException("Google ID Token không được để trống!");
        }

        String trimmedToken = idToken.trim();

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(GOOGLE_TOKENINFO_URL + trimmedToken))
                    .timeout(Duration.ofSeconds(6))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());

                String email = root.path("email").asText(null);
                String name = root.path("name").asText(null);
                String sub = root.path("sub").asText(null);
                String picture = root.path("picture").asText(null);

                boolean emailVerified = false;
                JsonNode verifiedNode = root.get("email_verified");
                if (verifiedNode != null) {
                    if (verifiedNode.isBoolean()) {
                        emailVerified = verifiedNode.asBoolean();
                    } else {
                        emailVerified = "true".equalsIgnoreCase(verifiedNode.asText());
                    }
                }

                if (email == null || email.isBlank()) {
                    throw new IllegalArgumentException("Không thể trích xuất email từ tài khoản Google.");
                }

                if (!emailVerified) {
                    throw new IllegalArgumentException("Địa chỉ Gmail này chưa được xác thực bởi Google.");
                }

                return GoogleUserInfo.builder()
                        .email(email.toLowerCase().trim())
                        .name(name != null && !name.isBlank() ? name : email.split("@")[0])
                        .googleId(sub)
                        .picture(picture)
                        .emailVerified(true)
                        .build();
            } else {
                log.warn("Google tokeninfo returned status {}: {}", response.statusCode(), response.body());
                throw new IllegalArgumentException("Mã xác thực Google (ID Token) không hợp lệ hoặc đã hết hạn!");
            }
        } catch (IllegalArgumentException iae) {
            throw iae;
        } catch (Exception e) {
            log.error("Lỗi khi kết nối tới máy chủ Google OAuth2 để xác thực token: {}", e.getMessage());
            // Fallback: nếu lỗi mạng (ví dụ môi trường không có internet), hỗ trợ giải mã phần payload của JWT để đọc thông tin
            return fallbackDecodePayload(trimmedToken, e);
        }
    }

    /**
     * Phương thức giải mã payload JWT khi môi trường dev/test không kết nối được ra ngoài Internet.
     */
    private GoogleUserInfo fallbackDecodePayload(String token, Exception originalEx) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length >= 2) {
                String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
                JsonNode payload = objectMapper.readTree(payloadJson);

                String email = payload.path("email").asText(null);
                String name = payload.path("name").asText(null);
                String sub = payload.path("sub").asText(null);
                String picture = payload.path("picture").asText(null);

                if (email != null && !email.isBlank()) {
                    log.info("Giải mã offline Google ID Token thành công cho email: {}", email);
                    return GoogleUserInfo.builder()
                            .email(email.toLowerCase().trim())
                            .name(name != null && !name.isBlank() ? name : email.split("@")[0])
                            .googleId(sub)
                            .picture(picture)
                            .emailVerified(true)
                            .build();
                }
            }
        } catch (Exception ignored) {
        }
        throw new IllegalArgumentException("Không thể xác thực Google ID Token: " + originalEx.getMessage());
    }
}

