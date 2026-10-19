package com.example.myapp.service;

import com.example.myapp.entity.Order;
import com.example.myapp.entity.OrderItem;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.time.format.DateTimeFormatter;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String mailUsername;

    public EmailService(
            JavaMailSender mailSender,
            @Value("${spring.mail.username:}") String mailUsername) {
        this.mailSender = mailSender;
        this.mailUsername = mailUsername;
    }

    private final ConcurrentHashMap<String, String> otpStorage = new ConcurrentHashMap<>();
    private static final int OTP_VALID_DURATION_MINUTES = 5;

    public void sendOtpEmail(String toEmail) {
        if (mailUsername.isBlank()) {
            throw new IllegalStateException("MAIL_USERNAME is not configured in backend/.env.");
        }

        String otp = generateOtp();
        long expiryTime = System.currentTimeMillis() + TimeUnit.MINUTES.toMillis(OTP_VALID_DURATION_MINUTES);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailUsername);
            message.setTo(toEmail);
            message.setSubject("Fashion Store - Your Password Reset OTP");
            message.setText("Your OTP for password reset is: " + otp + "\nIt is valid for " + OTP_VALID_DURATION_MINUTES + " minutes.");
            mailSender.send(message);
            otpStorage.put(toEmail, otp + "_" + expiryTime);
            System.out.println("✅ Real Email sent successfully to " + toEmail);
        } catch (Exception e) {
            System.err.println("Failed to send OTP email. Check MAIL_USERNAME and MAIL_PASSWORD. Error: " + e.getMessage());
            throw new IllegalStateException("Unable to send OTP email. Please check the mail configuration.", e);
        }
    }

    public boolean verifyOtp(String email, String enteredOtp, boolean consume) {
        String storedData = otpStorage.get(email);
        if (storedData == null) {
            return false;
        }

        String[] parts = storedData.split("_");
        String storedOtp = parts[0];
        long expiryTime = Long.parseLong(parts[1]);

        if (System.currentTimeMillis() > expiryTime) {
            otpStorage.remove(email); // expired
            return false;
        }

        if (storedOtp.equals(enteredOtp)) {
            if (consume) {
                otpStorage.remove(email); // valid, consume it
            }
            return true;
        }

        return false;
    }

    /**
     * Gửi email xác nhận đặt hàng kèm thông tin chi tiết đơn hàng
     */
    public void sendOrderConfirmationEmail(Order order) {
        if (mailUsername == null || mailUsername.isBlank() || mailUsername.contains("your-email") || order == null || order.getUser() == null) {
            System.out.println("⚠️ Bỏ qua gửi email xác nhận đặt hàng: MAIL_USERNAME chưa được cấu hình hoặc là placeholder.");
            return;
        }

        String toEmail = order.getUser().getEmail();
        if (toEmail == null || toEmail.isBlank()) return;

        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                DecimalFormat df = new DecimalFormat("#,###₫");
            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(mailUsername, "Fashion Store");
            helper.setTo(toEmail);
            helper.setSubject("🛍️ [Fashion Store] Xác nhận đơn hàng #" + order.getOrderId() + " đã đặt thành công");

            StringBuilder itemsHtml = new StringBuilder();
            if (order.getOrderItems() != null) {
                for (OrderItem oi : order.getOrderItems()) {
                    String pName = oi.getVariant() != null && oi.getVariant().getProduct() != null
                            ? oi.getVariant().getProduct().getName() : "Sản phẩm";
                    String variant = oi.getVariant() != null
                            ? (oi.getVariant().getColor() + " - Size " + oi.getVariant().getSize()) : "";
                    BigDecimal unitPrice = oi.getPriceAtPurchase() != null ? oi.getPriceAtPurchase() : BigDecimal.ZERO;
                    int qty = oi.getQuantity() != null ? oi.getQuantity() : 1;
                    BigDecimal sub = unitPrice.multiply(BigDecimal.valueOf(qty));

                    itemsHtml.append("<tr>")
                            .append("<td style='padding: 10px 12px; border-bottom: 1px solid #e2e8f0;'>")
                            .append("<strong style='color: #0f172a;'>").append(pName).append("</strong><br/>")
                            .append("<span style='color: #64748b; font-size: 0.85em;'>Phân loại: ").append(variant).append("</span>")
                            .append("</td>")
                            .append("<td style='padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #475569;'>").append(qty).append("</td>")
                            .append("<td style='padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #475569;'>").append(df.format(unitPrice)).append("</td>")
                            .append("<td style='padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #0f172a;'>").append(df.format(sub)).append("</td>")
                            .append("</tr>");
                }
            }

            String recipientName = order.getAddress() != null ? order.getAddress().getRecipientName() : order.getUser().getFullName();
            String phone = order.getAddress() != null ? order.getAddress().getPhone() : "";
            String addressStr = order.getAddress() != null ? (order.getAddress().getAddressLine() + ", " + order.getAddress().getCity()) : "";
            String discountInfo = order.getDiscountCode() != null ? ("<tr><td colspan='3' style='padding: 8px 12px; text-align: right; color: #059669;'>Voucher giảm giá (" + order.getDiscountCode().getCode() + "):</td><td style='padding: 8px 12px; text-align: right; color: #059669; font-weight: bold;'>Đã áp dụng</td></tr>") : "";

            String htmlContent = """
                <!DOCTYPE html>
                <html>
                <body style="font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #334155;">
                  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                    <div style="background-color: #0f172a; padding: 24px; text-align: center; color: #ffffff;">
                      <h1 style="margin: 0; font-size: 24px; letter-spacing: -0.5px;">Fashion<span style="color: #d29f96;">Store</span></h1>
                      <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.85;">Cảm ơn bạn đã mua sắm cùng chúng tôi!</p>
                    </div>
                    <div style="padding: 24px;">
                      <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">Xác nhận đơn hàng #%d</h2>
                      <p>Xin chào <strong>%s</strong>, đơn hàng của bạn đã được ghi nhận vào lúc %s.</p>
                      
                      <div style="background-color: #f1f5f9; padding: 14px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="margin: 0 0 8px; font-size: 14px; color: #0f172a;">📍 Địa chỉ nhận hàng:</h3>
                        <div style="font-size: 14px; line-height: 1.5;">
                          <strong>Người nhận:</strong> %s - 📞 %s<br/>
                          <strong>Địa chỉ:</strong> %s
                        </div>
                      </div>

                      <table style="width: 100%%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
                        <thead>
                          <tr style="background-color: #f8fafc;">
                            <th style="padding: 10px 12px; text-align: left; border-bottom: 2px solid #e2e8f0; color: #475569;">Sản phẩm</th>
                            <th style="padding: 10px 12px; text-align: center; border-bottom: 2px solid #e2e8f0; color: #475569;">SL</th>
                            <th style="padding: 10px 12px; text-align: right; border-bottom: 2px solid #e2e8f0; color: #475569;">Đơn giá</th>
                            <th style="padding: 10px 12px; text-align: right; border-bottom: 2px solid #e2e8f0; color: #475569;">Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody>
                          %s
                          <tr>
                            <td colspan="3" style="padding: 8px 12px; text-align: right; color: #64748b;">Phí vận chuyển:</td>
                            <td style="padding: 8px 12px; text-align: right; color: #059669; font-weight: bold;">MIỄN PHÍ</td>
                          </tr>
                          %s
                          <tr style="font-size: 16px;">
                            <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold; color: #0f172a; border-top: 2px solid #e2e8f0;">Tổng thanh toán:</td>
                            <td style="padding: 12px; text-align: right; font-weight: bold; color: #0f172a; border-top: 2px solid #e2e8f0;">%s</td>
                          </tr>
                        </tbody>
                      </table>

                      <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
                        Nếu bạn chưa hoàn tất thanh toán, vui lòng truy cập trang Lịch sử đơn hàng để tiếp tục thanh toán qua PayOS.
                      </p>
                    </div>
                    <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                      &copy; 2026 Fashion Store. Mọi thắc mắc vui lòng liên hệ hotline hỗ trợ.
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(
                    order.getOrderId(),
                    recipientName,
                    order.getCreatedAt() != null ? dtf.format(order.getCreatedAt()) : "",
                    recipientName,
                    phone,
                    addressStr,
                    itemsHtml.toString(),
                    discountInfo,
                    df.format(order.getTotalAmount())
            );

            helper.setText(htmlContent, true);
            mailSender.send(mimeMessage);
            System.out.println("✅ Email xác nhận đơn hàng #" + order.getOrderId() + " đã được gửi tới " + toEmail);
        } catch (Exception e) {
            System.err.println("⚠️ Lỗi gửi email xác nhận đơn hàng: " + e.getMessage());
        }
        });
    }

    /**
     * Gửi email biên nhận thanh toán PayOS thành công
     */
    public void sendPaymentConfirmationEmail(Order order, String transactionId, BigDecimal amount) {
        if (mailUsername == null || mailUsername.isBlank() || mailUsername.contains("your-email") || order == null || order.getUser() == null) {
            System.out.println("⚠️ Bỏ qua gửi email thanh toán: MAIL_USERNAME chưa được cấu hình hoặc là placeholder.");
            return;
        }

        String toEmail = order.getUser().getEmail();
        if (toEmail == null || toEmail.isBlank()) return;

        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
            DecimalFormat df = new DecimalFormat("#,###₫");

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(mailUsername, "Fashion Store");
            helper.setTo(toEmail);
            helper.setSubject("💳 [Fashion Store] Biên nhận thanh toán đơn hàng #" + order.getOrderId() + " thành công qua PayOS");

            String htmlContent = """
                <!DOCTYPE html>
                <html>
                <body style="font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #334155;">
                  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                    <div style="background-color: #059669; padding: 24px; text-align: center; color: #ffffff;">
                      <h1 style="margin: 0; font-size: 24px;">✓ THANH TOÁN THÀNH CÔNG</h1>
                      <p style="margin: 6px 0 0; font-size: 14px; opacity: 0.9;">Cổng thanh toán trực tuyến PayOS</p>
                    </div>
                    <div style="padding: 24px;">
                      <p>Xin chào <strong>%s</strong>,</p>
                      <p>Chúng tôi đã nhận được thanh toán của bạn cho đơn hàng <strong>#%d</strong> qua cổng thanh toán PayOS.</p>
                      
                      <div style="border: 1px dashed #cbd5e1; border-radius: 8px; padding: 16px; margin: 20px 0; background-color: #f8fafc;">
                        <table style="width: 100%%; font-size: 14px; line-height: 1.8;">
                          <tr>
                            <td style="color: #64748b;">Mã đơn hàng:</td>
                            <td style="text-align: right; font-weight: bold; color: #0f172a;">#%d</td>
                          </tr>
                          <tr>
                            <td style="color: #64748b;">Mã giao dịch PayOS:</td>
                            <td style="text-align: right; font-weight: bold; color: #0f172a;">%s</td>
                          </tr>
                          <tr>
                            <td style="color: #64748b;">Số tiền thanh toán:</td>
                            <td style="text-align: right; font-weight: bold; color: #059669; font-size: 16px;">%s</td>
                          </tr>
                          <tr>
                            <td style="color: #64748b;">Phương thức thanh toán:</td>
                            <td style="text-align: right; color: #0f172a;">Chuyển khoản QR PayOS</td>
                          </tr>
                          <tr>
                            <td style="color: #64748b;">Trạng thái:</td>
                            <td style="text-align: right; color: #059669; font-weight: bold;">ĐÃ THANH TOÁN (PAID)</td>
                          </tr>
                        </table>
                      </div>

                      <p style="font-size: 14px; line-height: 1.5; color: #334155;">
                        Fashion Store đang tiến hành đóng gói các sản phẩm và chuyển giao cho đơn vị vận chuyển. Bạn có thể theo dõi tiến độ giao hàng tại mục <strong>Đơn hàng của tôi</strong>.
                      </p>
                    </div>
                    <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                      &copy; 2026 Fashion Store. Cảm ơn bạn đã tin tưởng mua sắm!
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(
                    order.getUser().getFullName() != null ? order.getUser().getFullName() : "Quý khách",
                    order.getOrderId(),
                    order.getOrderId(),
                    transactionId,
                    df.format(amount)
            );

            helper.setText(htmlContent, true);
            mailSender.send(mimeMessage);
            System.out.println("✅ Email biên nhận thanh toán đơn hàng #" + order.getOrderId() + " đã được gửi tới " + toEmail);
        } catch (Exception e) {
            System.err.println("⚠️ Lỗi gửi email biên nhận thanh toán: " + e.getMessage());
        }
        });
    }

    private String generateOtp() {
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000); // 6 digit OTP
        return String.valueOf(otp);
    }
}
