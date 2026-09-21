package com.example.myapp;

import com.example.myapp.config.DatabaseInitializer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MyAppApplication {

	public static void main(String[] args) {
		try {
			DatabaseInitializer.initialize(
					"jdbc:sqlserver://localhost:1433;databaseName=FashionStoreDB;encrypt=true;trustServerCertificate=true;",
					"sa",
					"123456");
		} catch (Exception exception) {
			throw new IllegalStateException("Unable to create or verify FashionStoreDB", exception);
		}
		SpringApplication.run(MyAppApplication.class, args);
	}

	@org.springframework.context.event.EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
	public void logDatabaseConnectionSuccess() {
		System.out.println("\n=========================================================");
		System.out.println("✅ KẾT NỐI DATABASE THÀNH CÔNG VÀ ỨNG DỤNG ĐÃ CHẠY LÊN!");
		System.out.println("=========================================================\n");
	}

}
