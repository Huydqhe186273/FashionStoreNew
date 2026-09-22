package com.example.myapp.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
public class EmailService {

    private final org.springframework.mail.javamail.JavaMailSender mailSender;
    private final String mailUsername;

    public EmailService(
            org.springframework.mail.javamail.JavaMailSender mailSender,
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
            org.springframework.mail.SimpleMailMessage message = new org.springframework.mail.SimpleMailMessage();
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

    private String generateOtp() {
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000); // 6 digit OTP
        return String.valueOf(otp);
    }
}
