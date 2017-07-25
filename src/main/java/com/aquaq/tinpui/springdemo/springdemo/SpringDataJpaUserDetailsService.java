package com.aquaq.tinpui.springdemo.springdemo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

@Component
// The UserDetailsService interface has one method loadUserByUsername(),
// used to interrogate the user's information.
public class SpringDataJpaUserDetailsService implements UserDetailsService {

    private final ManagerRepository repository;

    @Autowired
    public SpringDataJpaUserDetailsService(ManagerRepository repository) {
        this.repository = repository;
    }

    @Override
    // Since we have a ManagerRepository, there is no need to write any SQL or JPA expressions
    // to fetch this needed data. In this class, it is autowired by constructor injection.
    public UserDetails loadUserByUsername(String name) throws UsernameNotFoundException {
        // The Repository.findByName() populates a Spring Security User instance,
        // which implements the UserDetails interface.
        Manager manager = this.repository.findByName(name);
        // Use Spring Security's AuthorityUtils to transition from an array of string-based roles
        // into a Java List of GrantedAuthority.
        return new User(manager.getName(), manager.getPassword(),
                AuthorityUtils.createAuthorityList(manager.getRoles()));
    }

}