package com.example.myapp.service;

import org.springframework.stereotype.Service;

import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
public class EmailService {

    private final org.springframework.mail.javamail.JavaMailSender mailSender;

    public EmailService(org.springframework.mail.javamail.JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    // Store OTP with email as key. Value is a string combining OTP and expiration time.
    // Format: "OTP_ExpiryTimestamp"
    private final ConcurrentHashMap<String, String> otpStorage = new ConcurrentHashMap<>();

    private static final int OTP_VALID_DURATION_MINUTES = 5;

    public void sendOtpEmail(String toEmail) {
        String otp = generateOtp();
        long expiryTime = System.currentTimeMillis() + TimeUnit.MINUTES.toMillis(OTP_VALID_DURATION_MINUTES);
        otpStorage.put(toEmail, otp + "_" + expiryTime);

        try {
            org.springframework.mail.SimpleMailMessage message = new org.springframework.mail.SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Fashion Store - Your Password Reset OTP");
            message.setText("Your OTP for password reset is: " + otp + "\nIt is valid for " + OTP_VALID_DURATION_MINUTES + " minutes.");
            mailSender.send(message);
            System.out.println("✅ Real Email sent successfully to " + toEmail);
        } catch (Exception e) {
            System.err.println("❌ Failed to send real email. Check your SMTP configuration in application.yml. Error: " + e.getMessage());
            // Fallback for local testing if SMTP is not configured
            System.out.println("==============================================");
            System.out.println("MOCK EMAIL SENDER (Fallback)");
            System.out.println("To: " + toEmail);
            System.out.println("Subject: Your Password Reset OTP");
            System.out.println("Body: Your OTP for password reset is: " + otp + ". It is valid for " + OTP_VALID_DURATION_MINUTES + " minutes.");
            System.out.println("==============================================");
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
