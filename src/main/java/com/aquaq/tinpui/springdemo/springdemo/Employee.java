package com.aquaq.tinpui.springdemo.springdemo;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Version;

// @Data is a Project Lombok annotation used to auto generate getters, setters, constructors
// and other things, so you don't have to.
@Data
// @Entity is a JPA (Java Persistence API) annotation that denotes the whole class
// for storage in a relational table.
@Entity
public class Employee {

    // @Id is a JPA annotation to specify the primary key.
    // @GeneratedValue is a JPA annotation used to auto generate this variable when needed.
    private @Id @GeneratedValue Long id;
    private String firstName;
    private String lastName;
    private String description;

    // @Version causes the value to be automatically stored
    // and updated every time a row is inserted or updated.
    private @Version @JsonIgnore Long version;

    private Employee() {}

    public Employee(String firstName, String lastName, String description) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.description = description;
    }
}
