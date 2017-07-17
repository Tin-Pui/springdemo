package com.aquaq.tinpui.springdemo.springdemo;

import org.springframework.data.repository.CrudRepository;

public interface EmployeeRepository extends CrudRepository<Employee, Long> {

}
