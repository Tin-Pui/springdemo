package com.aquaq.tinpui.springdemo.springdemo;

import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.security.access.prepost.PreAuthorize;

// Restrict access to people with ROLE_MANAGER only.
@PreAuthorize("hasRole('ROLE_MANAGER')")
// Extend PagingAndSortingRepository to enable pages and sorting support.
// Extend CrudRepository for minimal functionality.
// Plug in the type of domain object (Employee) and its type of primary key (Long).
// Note that the @PreAuthorize annotations are useless without a security policy.
public interface EmployeeRepository extends PagingAndSortingRepository<Employee, Long> {

    @Override
    // Allow save() if the employee has no manager assigned or has a manager matching the user's name.
    // Uses Spring Security's SpEL expressions to define access. The "?." handles null checks.
    @PreAuthorize("#employee?.manager?.name == authentication?.name or #employee?.manager == null")
    Employee save(@Param("employee") Employee employee);

    @Override
    @PreAuthorize("@employeeRepository.findOne(#id)?.manager?.name == authentication?.name")
    void delete(@Param("id") Long id);

    @Override
    // Either has access to the employee, or in the event it only has an id,
    // then it must find the employeeRepository in the application context,
    // perform a findOne(id), and then check the manager against the currently authenticated user.
    @PreAuthorize("#employee?.manager?.name == authentication?.name")
    void delete(@Param("employee") Employee employee);

}
