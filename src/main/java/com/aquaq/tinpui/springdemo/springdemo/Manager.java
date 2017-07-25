package com.aquaq.tinpui.springdemo.springdemo;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import lombok.ToString;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;

@Data
// Ensure that the Lombok-generated toString() method will not print out the password.
@ToString(exclude = "password")
@Entity
public class Manager {

    // The means to encrypt new passwords or to take password inputs and encrypt them before comparison.
    public static final PasswordEncoder PASSWORD_ENCODER = new BCryptPasswordEncoder();

    private @Id @GeneratedValue Long id;

    private String name;

    private @JsonIgnore String password;

    private String[] roles;

    public void setPassword(String password) {
        // Ensure that passwords are never stored in the clear.
        this.password = PASSWORD_ENCODER.encode(password);
    }

    protected Manager() {}

    public Manager(String name, String password, String... roles) {

        this.name = name;
        this.setPassword(password);
        this.roles = roles;
    }

}