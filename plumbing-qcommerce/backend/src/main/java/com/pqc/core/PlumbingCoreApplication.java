package com.pqc.core;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class PlumbingCoreApplication {

	public static void main(String[] args) {
		SpringApplication.run(PlumbingCoreApplication.class, args);
	}

}
