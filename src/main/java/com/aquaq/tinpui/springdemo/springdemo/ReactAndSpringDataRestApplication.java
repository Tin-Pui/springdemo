package com.aquaq.tinpui.springdemo.springdemo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;


@SpringBootApplication
public class ReactAndSpringDataRestApplication {

    // Run this after compiling, or use "./mvnw spring-boot:run" command in the terminal.
    public static void main(String[] args) {
        SpringApplication.run(ReactAndSpringDataRestApplication.class, args);
        // Run the application and use the "curl" command to read/insert the schema.
        // Or access the application by opening a browser and go to "localhost:8080".
    }
}