package com.aquaq.tinpui.springdemo.springdemo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.core.annotation.HandleBeforeCreate;
import org.springframework.data.rest.core.annotation.HandleBeforeSave;
import org.springframework.data.rest.core.annotation.RepositoryEventHandler;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/*
Add security details automatically. Allow a new employee being added to be
automatically assigned to the manager who adds the employee record.
*/
@Component
// Flag this event handler to only apply to Employee objects.
@RepositoryEventHandler(Employee.class)
public class SpringDataRestEventHandler {

    private final ManagerRepository managerRepository;

    @Autowired
    public SpringDataRestEventHandler(ManagerRepository managerRepository) {
        this.managerRepository = managerRepository;
    }

    /*
    The @HandleBeforeCreate annotation gives you a chance to alter the incoming
    Employee record before writing to the database.
    */
    @HandleBeforeCreate
    public void applyUserInformationUsingSecurityContext(Employee employee) {

        String name = SecurityContextHolder.getContext().getAuthentication().getName();
        Manager manager = this.managerRepository.findByName(name);
        /*
        Add a bit of glue code to support initialization. But in a real production system,
        this code should be removed and instead depend on the DBAs or Security team to
        properly maintain the user data store.
        */
        if (manager == null) {
            Manager newManager = new Manager();
            newManager.setName(name);
            newManager.setRoles(new String[]{"ROLE_MANAGER"});
            manager = this.managerRepository.save(newManager);
        }
        employee.setManager(manager);
    }

    @HandleBeforeSave
    public void getUserInformationUsingSecurityContext(Employee employee) {
        String name = SecurityContextHolder.getContext().getAuthentication().getName();
        Manager manager = this.managerRepository.findByName(name);
        employee.setManager(manager);
    }
}
