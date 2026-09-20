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
			DatabaseInitializer.initialize(
					"jdbc:sqlserver://CUONG;instanceName=MSSQLSERVER02;databaseName=FashionStoreDB;encrypt=true;trustServerCertificate=true;",
					"sa",
					"12345");
		}
		catch (Exception exception) {
			throw new IllegalStateException("Unable to create or verify FashionStoreDB", exception);
		}
		SpringApplication.run(MyAppApplication.class, args);
	}

	@org.springframework.context.event.EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
	// In thông báo xác nhận sau khi Spring Boot đã sẵn sàng nhận request.
	public void logDatabaseConnectionSuccess() {
		System.out.println("\n=========================================================");
		System.out.println("✅ KẾT NỐI DATABASE THÀNH CÔNG VÀ ỨNG DỤNG ĐÃ CHẠY LÊN!");
		System.out.println("=========================================================\n");
	}

}
