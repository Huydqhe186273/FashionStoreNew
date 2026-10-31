package com.example.myapp.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Service
public class CloudinaryService {

    private static final Logger log = LoggerFactory.getLogger(CloudinaryService.class);
    private final Cloudinary cloudinary;
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg");

    @Value("${cloudinary.cloud-name:demo}")
    private String cloudName;

    @Value("${cloudinary.api-key:123456789012345}")
    private String apiKey;

    public CloudinaryService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    /**
     * Kiểm tra xem cấu hình Cloudinary có phải là mặc định demo hay không
     */
    public boolean isConfigured() {
        return cloudName != null && !cloudName.isBlank() && !"demo".equalsIgnoreCase(cloudName)
                && apiKey != null && !apiKey.isBlank() && !"123456789012345".equals(apiKey);
    }

    /**
     * Tải file ảnh lên Cloudinary và trả về URL ảnh an toàn (secure_url).
     */
    public String uploadImage(MultipartFile file, String folderName) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn file ảnh để tải lên!");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_EXTENSIONS.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Định dạng file không hợp lệ! Chỉ chấp nhận JPG, PNG, WEBP, GIF.");
        }

        // Tối đa 10MB
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("Dung lượng ảnh vượt quá giới hạn 10MB!");
        }

        String folder = "fashionstore/" + (folderName != null && !folderName.isBlank() ? folderName : "products");

        try {
            Map<?, ?> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", folder,
                            "resource_type", "image"
                    )
            );

            Object secureUrl = uploadResult.get("secure_url");
            if (secureUrl == null) {
                throw new IllegalStateException("Không nhận được đường dẫn ảnh từ Cloudinary!");
            }

            return secureUrl.toString();
        } catch (Exception e) {
            log.error("Lỗi khi tải ảnh lên Cloudinary: {}", e.getMessage(), e);
            if (!isConfigured()) {
                throw new IllegalStateException("Hệ thống chưa cấu hình tài khoản Cloudinary hợp lệ (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET). Vui lòng cập nhật thông tin trong backend/.env trước khi tải ảnh!");
            }
            throw new IOException("Không thể tải ảnh lên Cloudinary: " + e.getMessage(), e);
        }
    }

    /**
     * Xóa ảnh trên Cloudinary theo public_id
     */
    public void deleteImage(String publicId) {
        if (publicId == null || publicId.isBlank()) return;
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            log.info("Đã xóa ảnh trên Cloudinary: {}", publicId);
        } catch (Exception e) {
            log.warn("Không thể xóa ảnh trên Cloudinary (publicId={}): {}", publicId, e.getMessage());
        }
    }

    /**
     * Xóa ảnh trên Cloudinary dựa trên đường dẫn secure_url
     */
    public void deleteByUrl(String imageUrl) {
        if (imageUrl == null || !imageUrl.contains("res.cloudinary.com")) return;
        try {
            // URL dạng: https://res.cloudinary.com/<cloud>/image/upload/v12345/fashionstore/products/name.jpg
            int uploadIndex = imageUrl.indexOf("/upload/");
            if (uploadIndex == -1) return;
            String pathAfterUpload = imageUrl.substring(uploadIndex + 8);
            // Bỏ version nếu có (vd: v1712345678/)
            if (pathAfterUpload.startsWith("v") && pathAfterUpload.indexOf("/") > 0) {
                pathAfterUpload = pathAfterUpload.substring(pathAfterUpload.indexOf("/") + 1);
            }
            // Bỏ phần extension (vd: .jpg, .png)
            int dotIndex = pathAfterUpload.lastIndexOf(".");
            String publicId = dotIndex > 0 ? pathAfterUpload.substring(0, dotIndex) : pathAfterUpload;
            deleteImage(publicId);
        } catch (Exception e) {
            log.warn("Không thể bóc tách publicId để xóa trên Cloudinary: {}", e.getMessage());
        }
    }
}
