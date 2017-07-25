package com.aquaq.tinpui.springdemo.springdemo;

import org.springframework.data.repository.Repository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

// Spring Data REST will (by default) export any repository it finds.
// We do not want this repository exposed for REST operations.
@RepositoryRestResource(exported = false) // Block from export.
/* Instead of extending the usual CrudRepository, use Spring Data Common's minimal Repository
   with no predefined operations. We only need to save data and look up existing users. */
public interface ManagerRepository extends Repository<Manager, Long> {

    Manager save(Manager manager);

    Manager findByName(String name);

}
