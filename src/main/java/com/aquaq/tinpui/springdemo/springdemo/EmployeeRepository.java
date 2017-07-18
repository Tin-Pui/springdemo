package com.aquaq.tinpui.springdemo.springdemo;

import org.springframework.data.repository.PagingAndSortingRepository;

// Extend PagingAndSortingRepository to enable pages and sorting support.
// Extend CrudRepository for minimal functionality.
// Plug in the type of domain object (Employee) and its type of primary key (Long).
public interface EmployeeRepository extends PagingAndSortingRepository<Employee, Long> {

}
