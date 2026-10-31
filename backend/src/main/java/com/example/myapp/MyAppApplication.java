package com.example.myapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import com.example.myapp.config.DatabaseInitializer;

@SpringBootApplication
public class MyAppApplication {
  
	// Điểm khởi động ứng dụng: bảo đảm database tồn tại trước khi chạy Spring Boot.
	// args chứa các tham số dòng lệnh khi chạy ứng dụng.
	public static void main(String[] args) {
		try {
			loadDotEnv();
			// Connection config from environment variables / .env (with safe defaults).
			String dbUrl = getProperty("DB_URL",
				"jdbc:sqlserver://localhost:1433;databaseName=FashionStoreDB;encrypt=true;trustServerCertificate=true;sendStringParametersAsUnicode=true;characterEncoding=UTF-8;stringtype=nvarchar;");
			String dbUser = getProperty("DB_USERNAME", "sa");
			String dbPass = getProperty("DB_PASSWORD", "123456");
			DatabaseInitializer.initialize(dbUrl, dbUser, dbPass);
		} catch (Exception exception) {
			throw new IllegalStateException("Unable to create or verify FashionStoreDB", exception);
		}
		SpringApplication.run(MyAppApplication.class, args);
	}

	private static void loadDotEnv() {
		String[] paths = {".env", "backend/.env", "../backend/.env"};
		for (String path : paths) {
			java.io.File envFile = new java.io.File(path);
			if (envFile.isFile()) {
				try (java.io.FileInputStream fis = new java.io.FileInputStream(envFile)) {
					java.util.Properties props = new java.util.Properties();
					props.load(fis);
					for (String key : props.stringPropertyNames()) {
						if (System.getProperty(key) == null) {
							System.setProperty(key, props.getProperty(key));
						}
					}
					break;
				} catch (Exception ignored) {
				}
			}
		}
	}

	private static String getProperty(String key, String defaultValue) {
		String sysProp = System.getProperty(key);
		if (sysProp != null && !sysProp.isBlank()) {
			return sysProp;
		}
		String envVal = System.getenv(key);
		if (envVal != null && !envVal.isBlank()) {
			return envVal;
		}
		return defaultValue;
	}

	@org.springframework.context.event.EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
	// In thông báo xác nhận sau khi Spring Boot đã sẵn sàng nhận request.
	public void logDatabaseConnectionSuccess() {
		System.out.println("\n=========================================================");
		System.out.println(">>> KET NOI DATABASE THANH CONG VA UNG DUNG DA CHAY LEN! <<<");
		System.out.println("=========================================================\n");
	}

}
