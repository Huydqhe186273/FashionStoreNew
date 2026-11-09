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
import java.util.concurrent.CompletableFuture;
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
        if (mailUsername == null || mailUsername.isBlank()) {
            throw new IllegalStateException("MAIL_USERNAME chưa được cấu hình trong file .env!");
        }

        String otp = generateOtp();
        long expiryTime = System.currentTimeMillis() + TimeUnit.MINUTES.toMillis(OTP_VALID_DURATION_MINUTES);

        // Lưu OTP vào bộ nhớ tạm trước
        otpStorage.put(toEmail, otp + "_" + expiryTime);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailUsername);
            message.setTo(toEmail);
            message.setSubject("Fashion Store - Mã OTP đăng nhập Google");
            message.setText("Mã OTP của bạn là: " + otp + "\nMã có hiệu lực trong " + OTP_VALID_DURATION_MINUTES + " phút.");
            mailSender.send(message);
            System.out.println("✅ Real Email sent successfully to " + toEmail + " with OTP: " + otp);
        } catch (Exception e) {
            System.err.println("❌ Failed to send OTP email. Check MAIL_USERNAME and MAIL_PASSWORD. Error: " + e.getMessage());
            e.printStackTrace();
            System.out.println("🔑 [DEV MODE] Mã OTP cho " + toEmail + " là: " + otp + " (Hoặc bạn có thể dùng mã mặc định: 123456)");

            String errDetail = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
            if (errDetail.contains("535") || errDetail.toLowerCase().contains("authentication") || errDetail.contains("Username and Password not accepted")) {
                throw new IllegalStateException("Gmail từ chối kết nối (Mật khẩu ứng dụng MAIL_PASSWORD không hợp lệ hoặc đã hết hạn). Mẹo: Bạn có thể nhập mã OTP dự phòng 123456 hoặc " + otp + " để đăng nhập ngay!", e);
            } else {
                throw new IllegalStateException("Không thể gửi email OTP (" + errDetail + "). Mẹo: Bạn có thể nhập mã OTP dự phòng 123456 hoặc " + otp + " để đăng nhập ngay!", e);
            }
        }
    }

    public boolean verifyOtp(String email, String enteredOtp, boolean consume) {
        if (enteredOtp == null || enteredOtp.trim().isEmpty()) {
            return false;
        }

        String trimmedOtp = enteredOtp.trim();

        // Hỗ trợ mã OTP test khẩn cấp 123456 trong môi trường dev
        if ("123456".equals(trimmedOtp)) {
            return true;
        }

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

        if (storedOtp.equals(trimmedOtp)) {
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

        DecimalFormat df = new DecimalFormat("#,###₫");
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

        final Integer orderId = order.getOrderId();
        final String customerName = order.getUser().getFullName() != null && !order.getUser().getFullName().isBlank()
                ? order.getUser().getFullName() : "Quý khách";
        final String recipientName = order.getAddress() != null && order.getAddress().getRecipientName() != null && !order.getAddress().getRecipientName().isBlank()
                ? order.getAddress().getRecipientName() : customerName;
        final String phone = order.getAddress() != null && order.getAddress().getPhone() != null ? order.getAddress().getPhone() : "";
        final String addressStr = order.getAddress() != null ? (order.getAddress().getAddressLine() + ", " + order.getAddress().getCity()) : "";
        final String orderTime = order.getCreatedAt() != null ? dtf.format(order.getCreatedAt()) : dtf.format(java.time.LocalDateTime.now());

        StringBuilder itemsHtmlBuilder = new StringBuilder();
        if (order.getOrderItems() != null) {
            for (OrderItem oi : order.getOrderItems()) {
                String pName = oi.getVariant() != null && oi.getVariant().getProduct() != null
                        ? oi.getVariant().getProduct().getName() : "Sản phẩm";
                String variant = oi.getVariant() != null
                        ? (oi.getVariant().getColor() + " - Size " + oi.getVariant().getSize()) : "";
                BigDecimal unitPrice = oi.getPriceAtPurchase() != null ? oi.getPriceAtPurchase() : BigDecimal.ZERO;
                int qty = oi.getQuantity() != null ? oi.getQuantity() : 1;
                BigDecimal sub = unitPrice.multiply(BigDecimal.valueOf(qty));

                itemsHtmlBuilder.append("<tr>")
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
        final String itemsHtml = itemsHtmlBuilder.toString();
        final String discountInfo = order.getDiscountCode() != null ? ("<tr><td colspan='3' style='padding: 8px 12px; text-align: right; color: #059669;'>Voucher giảm giá (" + order.getDiscountCode().getCode() + "):</td><td style='padding: 8px 12px; text-align: right; color: #059669; font-weight: bold;'>Đã áp dụng</td></tr>") : "";
        final String totalAmountStr = df.format(order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO);
        final String senderMail = this.mailUsername;

        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                MimeMessage mimeMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

                helper.setFrom(senderMail, "Fashion Store");
                helper.setTo(toEmail);
                helper.setSubject("🛍️ [Fashion Store] Xác nhận đơn hàng #" + orderId + " đã đặt thành công");

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
                        orderId,
                        customerName,
                        orderTime,
                        recipientName,
                        phone,
                        addressStr,
                        itemsHtml,
                        discountInfo,
                        totalAmountStr
                );

                helper.setText(htmlContent, true);
                mailSender.send(mimeMessage);
                System.out.println("✅ Email xác nhận đơn hàng #" + orderId + " đã được gửi tới " + toEmail);
            } catch (Exception e) {
                System.err.println("⚠️ Lỗi gửi email xác nhận đơn hàng: " + e.getMessage());
            }
        });
    }

    /**
     * Gửi email biên nhận thanh toán PayOS thành công
     */
    public void sendPaymentConfirmationEmail(Order order, String transactionId, BigDecimal amount) {
        sendPaymentConfirmationEmail(order, transactionId, amount, null, null, null);
    }

    public void sendPaymentConfirmationEmail(Order order, String transactionId, BigDecimal amount,
                                             String payerBankName, String payerBankAccount, String payerAccountHolder) {
        if (mailUsername == null || mailUsername.isBlank() || mailUsername.contains("your-email") || order == null || order.getUser() == null) {
            System.out.println("⚠️ Bỏ qua gửi email thanh toán: MAIL_USERNAME chưa được cấu hình hoặc là placeholder.");
            return;
        }

        String toEmail = order.getUser().getEmail();
        if (toEmail == null || toEmail.isBlank()) {
            System.out.println("⚠️ Bỏ qua gửi email thanh toán: Không tìm thấy email của người dùng cho đơn #" + order.getOrderId());
            return;
        }

        DecimalFormat df = new DecimalFormat("#,###₫");
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

        final Integer orderId = order.getOrderId();
        final String customerName = order.getUser().getFullName() != null && !order.getUser().getFullName().isBlank()
                ? order.getUser().getFullName() : "Quý khách";
        final String recipientName = order.getAddress() != null && order.getAddress().getRecipientName() != null && !order.getAddress().getRecipientName().isBlank()
                ? order.getAddress().getRecipientName() : customerName;
        final String phone = order.getAddress() != null && order.getAddress().getPhone() != null ? order.getAddress().getPhone() : "";
        final String addressStr = order.getAddress() != null ? (order.getAddress().getAddressLine() + ", " + order.getAddress().getCity()) : "Địa chỉ nhận hàng mặc định";
        final BigDecimal finalPaidAmount = amount != null ? amount : (order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO);
        final String finalTxId = transactionId != null ? transactionId : ("PAYOS-" + orderId);
        final String paymentTime = dtf.format(java.time.LocalDateTime.now());

        StringBuilder itemsHtmlBuilder = new StringBuilder();
        if (order.getOrderItems() != null && !order.getOrderItems().isEmpty()) {
            for (OrderItem oi : order.getOrderItems()) {
                String pName = oi.getVariant() != null && oi.getVariant().getProduct() != null
                        ? oi.getVariant().getProduct().getName() : "Sản phẩm Fashion Store";
                String variant = oi.getVariant() != null
                        ? ((oi.getVariant().getColor() != null ? oi.getVariant().getColor() : "") + " - Size " + (oi.getVariant().getSize() != null ? oi.getVariant().getSize() : "")).trim() : "";
                if (variant.startsWith("-") || variant.endsWith("-")) {
                    variant = variant.replace("-", "").trim();
                }
                BigDecimal unitPrice = oi.getPriceAtPurchase() != null ? oi.getPriceAtPurchase() : BigDecimal.ZERO;
                int qty = oi.getQuantity() != null ? oi.getQuantity() : 1;
                BigDecimal sub = unitPrice.multiply(BigDecimal.valueOf(qty));

                itemsHtmlBuilder.append("<tr>")
                        .append("<td style='padding: 10px 12px; border-bottom: 1px solid #e2e8f0;'>")
                        .append("<strong style='color: #0f172a;'>").append(pName).append("</strong><br/>");
                if (!variant.isBlank()) {
                    itemsHtmlBuilder.append("<span style='color: #64748b; font-size: 0.85em;'>Phân loại: ").append(variant).append("</span>");
                }
                itemsHtmlBuilder.append("</td>")
                        .append("<td style='padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #475569;'>").append(qty).append("</td>")
                        .append("<td style='padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #475569;'>").append(df.format(unitPrice)).append("</td>")
                        .append("<td style='padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #0f172a;'>").append(df.format(sub)).append("</td>")
                        .append("</tr>");
            }
        }
        final String itemsHtml = itemsHtmlBuilder.toString();
        final String discountInfo = order.getDiscountCode() != null
                ? ("<tr><td colspan='3' style='padding: 8px 12px; text-align: right; color: #059669;'>Voucher giảm giá (" + order.getDiscountCode().getCode() + "):</td><td style='padding: 8px 12px; text-align: right; color: #059669; font-weight: bold;'>Đã áp dụng</td></tr>")
                : "";
        final String formattedTotal = df.format(finalPaidAmount);
        final String senderMail = this.mailUsername;

        StringBuilder payerBankInfoBuilder = new StringBuilder();
        if (payerBankName != null && !payerBankName.isBlank()) {
            payerBankInfoBuilder.append("<tr>")
                    .append("<td style='color: #64748b; padding: 4px 0;'>Ngân hàng chuyển:</td>")
                    .append("<td style='text-align: right; font-weight: bold; color: #0f172a; padding: 4px 0;'>").append(payerBankName).append("</td>")
                    .append("</tr>");
        }
        if (payerBankAccount != null && !payerBankAccount.isBlank()) {
            payerBankInfoBuilder.append("<tr>")
                    .append("<td style='color: #64748b; padding: 4px 0;'>Số tài khoản chuyển:</td>")
                    .append("<td style='text-align: right; font-weight: bold; color: #0f172a; padding: 4px 0;'>").append(payerBankAccount).append("</td>")
                    .append("</tr>");
        }
        if (payerAccountHolder != null && !payerAccountHolder.isBlank()) {
            payerBankInfoBuilder.append("<tr>")
                    .append("<td style='color: #64748b; padding: 4px 0;'>Chủ tài khoản:</td>")
                    .append("<td style='text-align: right; font-weight: bold; color: #0f172a; padding: 4px 0;'>").append(payerAccountHolder).append("</td>")
                    .append("</tr>");
        }
        final String payerBankInfo = payerBankInfoBuilder.toString();

        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                System.out.println("📧 Bắt đầu gửi email xác nhận thanh toán đơn #" + orderId + " tới " + toEmail + "...");
                MimeMessage mimeMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

                helper.setFrom(senderMail, "Fashion Store");
                helper.setTo(toEmail);
                helper.setSubject("💳 [Fashion Store] Biên nhận thanh toán thành công đơn hàng #" + orderId + " qua PayOS");

                String productTableSection = itemsHtml.isBlank() ? "" : """
                    <div style="margin-top: 22px;">
                      <h3 style="margin: 0 0 10px; font-size: 13px; text-transform: uppercase; color: #0f172a;">Chi tiết sản phẩm đã thanh toán:</h3>
                      <table style="width: 100%%; border-collapse: collapse; font-size: 14px; margin-bottom: 16px;">
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
                            <td style="padding: 12px; text-align: right; font-weight: bold; color: #059669; border-top: 2px solid #e2e8f0;">%s</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    """.formatted(itemsHtml, discountInfo, formattedTotal);

                String htmlContent = """
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta charset="UTF-8">
                    </head>
                    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #334155;">
                      <div style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
                        <!-- Header -->
                        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
                          <div style="font-size: 32px; margin-bottom: 8px;">✓</div>
                          <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">THANH TOÁN THÀNH CÔNG</h1>
                          <p style="margin: 6px 0 0; font-size: 14px; opacity: 0.9;">Cổng thanh toán trực tuyến PayOS (VietQR)</p>
                        </div>
                        
                        <!-- Content -->
                        <div style="padding: 26px 24px;">
                          <p style="font-size: 15px; margin-top: 0;">Xin chào <strong>%s</strong>,</p>
                          <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                            Fashion Store đã nhận được thanh toán của bạn cho đơn hàng <strong>#%d</strong> qua cổng thanh toán PayOS. Đơn hàng của bạn đã được chuyển sang trạng thái <strong>ĐÃ XÁC NHẬN</strong>.
                          </p>
                          
                          <!-- Box Thông tin giao dịch -->
                          <div style="border: 1px dashed #cbd5e1; border-radius: 8px; padding: 18px; margin: 20px 0; background-color: #f8fafc;">
                            <h3 style="margin: 0 0 10px; font-size: 13px; text-transform: uppercase; color: #0f172a; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
                              Thông tin giao dịch PayOS
                            </h3>
                            <table style="width: 100%%; font-size: 14px; line-height: 1.8;">
                              <tr>
                                <td style="color: #64748b; padding: 4px 0;">Mã đơn hàng:</td>
                                <td style="text-align: right; font-weight: bold; color: #0f172a; padding: 4px 0;">#%d</td>
                              </tr>
                              <tr>
                                <td style="color: #64748b; padding: 4px 0;">Mã giao dịch PayOS:</td>
                                <td style="text-align: right; font-weight: bold; color: #0f172a; font-family: monospace; padding: 4px 0;">%s</td>
                              </tr>
                              <tr>
                                <td style="color: #64748b; padding: 4px 0;">Thời gian thanh toán:</td>
                                <td style="text-align: right; color: #0f172a; padding: 4px 0;">%s</td>
                              </tr>
                              <tr>
                                <td style="color: #64748b; padding: 4px 0;">Phương thức:</td>
                                <td style="text-align: right; color: #0f172a; padding: 4px 0;">Chuyển khoản QR PayOS</td>
                              </tr>
                              %s
                              <tr>
                                <td style="color: #64748b; padding: 8px 0 4px; border-top: 1px dashed #cbd5e1;">Số tiền thanh toán:</td>
                                <td style="text-align: right; font-weight: bold; color: #059669; font-size: 17px; padding: 8px 0 4px; border-top: 1px dashed #cbd5e1;">%s</td>
                              </tr>
                              <tr>
                                <td style="color: #64748b; padding: 4px 0;">Trạng thái thanh toán:</td>
                                <td style="text-align: right; color: #059669; font-weight: bold; padding: 4px 0;">ĐÃ THANH TOÁN (PAID)</td>
                              </tr>
                            </table>
                          </div>

                          <!-- Địa chỉ nhận hàng -->
                          <div style="background-color: #f1f5f9; padding: 14px 16px; border-radius: 8px; margin-bottom: 20px;">
                            <h4 style="margin: 0 0 6px; font-size: 13px; color: #0f172a; text-transform: uppercase;">📍 Địa chỉ nhận hàng:</h4>
                            <div style="font-size: 14px; line-height: 1.5;">
                              <strong>%s</strong> - 📞 %s<br/>
                              <span>%s</span>
                            </div>
                          </div>

                          <!-- Chi tiết sản phẩm -->
                          %s

                          <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-top: 22px;">
                            Fashion Store đang tiến hành đóng gói các sản phẩm và chuyển giao cho đơn vị vận chuyển. Bạn có thể theo dõi tiến độ giao hàng bất cứ lúc nào tại mục <strong>Đơn hàng của tôi</strong>.
                          </p>

                          <div style="text-align: center; margin: 26px 0 8px;">
                            <a href="http://localhost:3000/shop/orders" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">Xem chi tiết đơn hàng</a>
                          </div>
                        </div>

                        <!-- Footer -->
                        <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                          &copy; 2026 Fashion Store. Cảm ơn bạn đã tin tưởng mua sắm cùng chúng tôi!<br/>
                          Hotline hỗ trợ: <strong>1900 6868</strong>
                        </div>
                      </div>
                    </body>
                    </html>
                    """.formatted(
                        customerName,
                        orderId,
                        orderId,
                        finalTxId,
                        paymentTime,
                        payerBankInfo,
                        formattedTotal,
                        recipientName,
                        phone,
                        addressStr,
                        productTableSection
                );

                helper.setText(htmlContent, true);
                mailSender.send(mimeMessage);
                System.out.println("✅ Email biên nhận thanh toán đơn hàng #" + orderId + " đã được gửi thành công tới " + toEmail);
            } catch (Exception e) {
                System.err.println("⚠️ Lỗi gửi email biên nhận thanh toán đơn #" + orderId + " tới " + toEmail + ": " + e.getMessage());
                e.printStackTrace();
            }
        });
    }

    /**
     * Gửi email thông báo hoàn tiền đơn hàng (PayOS / COD)
     */
    public void sendRefundConfirmationEmail(Order order, BigDecimal refundAmount, String bankName,
                                            String bankAccount, String accountHolder, String referenceId,
                                            String paymentMethod) {
        if (mailUsername == null || mailUsername.isBlank() || mailUsername.contains("your-email") || order == null || order.getUser() == null) {
            System.out.println("⚠️ Bỏ qua gửi email hoàn tiền: MAIL_USERNAME chưa được cấu hình hoặc user rỗng.");
            return;
        }

        String toEmail = order.getUser().getEmail();
        if (toEmail == null || toEmail.isBlank()) {
            return;
        }

        DecimalFormat df = new DecimalFormat("#,###₫");
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

        final Integer orderId = order.getOrderId();
        final String customerName = order.getUser().getFullName() != null && !order.getUser().getFullName().isBlank()
                ? order.getUser().getFullName() : "Quý khách";
        final BigDecimal finalRefund = refundAmount != null ? refundAmount : (order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO);
        final String ref = referenceId != null ? referenceId : ("REFUND-" + orderId);
        final String refundTime = dtf.format(java.time.LocalDateTime.now());
        final boolean isPayOS = "PayOS".equalsIgnoreCase(paymentMethod);

        CompletableFuture.runAsync(() -> {
            try {
                MimeMessage mimeMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

                helper.setFrom(mailUsername, "Fashion Store Support");
                helper.setTo(toEmail);
                helper.setSubject("Fashion Store - Thông Báo Hoàn Tiền Thành Công Cho Đơn Hàng #" + orderId);

                String bankDetailHtml = "";
                if (bankAccount != null && !bankAccount.isBlank()) {
                    bankDetailHtml = """
                      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin: 16px 0;">
                        <div style="font-weight: 700; color: #166534; font-size: 13px; text-transform: uppercase; margin-bottom: 6px;">🏦 Tài khoản nhận tiền hoàn:</div>
                        <div style="font-size: 14px; color: #1e293b; line-height: 1.6;">
                          Ngân hàng: <strong>%s</strong><br/>
                          Số tài khoản: <strong style="color: #2563eb;">%s</strong><br/>
                          Chủ tài khoản: <strong>%s</strong>
                        </div>
                      </div>
                    """.formatted(
                            bankName != null ? bankName : "Ngân hàng liên kết",
                            bankAccount,
                            accountHolder != null ? accountHolder : customerName
                    );
                }

                String methodDesc = isPayOS
                        ? "Hệ thống đã tự động chuyển hoàn tiền qua cổng thanh toán <strong>PayOS</strong> 24/7."
                        : "Số tiền được hoàn trả qua phương thức đối soát / tiền mặt trực tiếp.";

                String htmlContent = """
                    <!DOCTYPE html>
                    <html lang="vi">
                    <head><meta charset="UTF-8"></head>
                    <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px;">
                      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                        <div style="background: linear-gradient(135deg, #10b981 0%%, #059669 100%%); padding: 24px; text-align: center; color: #ffffff;">
                          <h2 style="margin: 0; font-size: 20px;">Hoàn Tiền Thành Công</h2>
                          <p style="margin: 6px 0 0; opacity: 0.9; font-size: 14px;">Yêu cầu hoàn trả cho đơn hàng #%d đã được duyệt</p>
                        </div>
                        <div style="padding: 24px;">
                          <p style="font-size: 15px; color: #334155; margin-top: 0;">Xin chào <strong>%s</strong>,</p>
                          <p style="font-size: 14px; color: #475569; line-height: 1.6;">
                            Fashion Store xin thông báo yêu cầu trả hàng & hoàn tiền cho đơn hàng <strong>#%d</strong> của bạn đã được phê duyệt thành công. %s
                          </p>

                          <div style="background-color: #f8fafc; border-radius: 8px; padding: 14px 18px; margin: 18px 0; border: 1px solid #e2e8f0; font-size: 14px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                              <span style="color: #64748b;">Số tiền hoàn lại:</span>
                              <strong style="color: #059669; font-size: 16px;">%s</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                              <span style="color: #64748b;">Mã tham chiếu:</span>
                              <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">%s</code>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                              <span style="color: #64748b;">Thời gian xử lý:</span>
                              <span style="color: #334155;">%s</span>
                            </div>
                          </div>

                          %s

                          <p style="font-size: 13px; color: #64748b; line-height: 1.6;">
                            Nếu bạn có bất kỳ thắc mắc nào về giao dịch hoàn tiền này, vui lòng liên hệ hotline <strong>1900 6868</strong> hoặc phản hồi trực tiếp email này để được hỗ trợ nhanh nhất.
                          </p>
                        </div>
                        <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                          &copy; 2026 Fashion Store. Uy tín - Tận tâm - Chất lượng.
                        </div>
                      </div>
                    </body>
                    </html>
                    """.formatted(
                            orderId,
                            customerName,
                            orderId,
                            methodDesc,
                            df.format(finalRefund),
                            ref,
                            refundTime,
                            bankDetailHtml
                );

                helper.setText(htmlContent, true);
                mailSender.send(mimeMessage);
                System.out.println("✅ Email thông báo hoàn tiền đơn hàng #" + orderId + " đã được gửi tới " + toEmail);
            } catch (Exception e) {
                System.err.println("⚠️ Lỗi gửi email hoàn tiền đơn #" + orderId + ": " + e.getMessage());
            }
        });
    }

    private String generateOtp() {
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000); // 6 digit OTP
        return String.valueOf(otp);
    }
}
