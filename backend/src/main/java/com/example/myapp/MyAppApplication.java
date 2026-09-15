package com.example.myapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MyAppApplication {

	public static void main(String[] args) {
		org.springframework.boot.SpringApplication.run(MyAppApplication.class, args);
	}

	@org.springframework.context.event.EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
	public void logDatabaseConnectionSuccess() {
		System.out.println("\n=========================================================");
		System.out.println("✅ KẾT NỐI DATABASE THÀNH CÔNG VÀ ỨNG DỤNG ĐÃ CHẠY LÊN!");
		System.out.println("=========================================================\n");
	}

}
