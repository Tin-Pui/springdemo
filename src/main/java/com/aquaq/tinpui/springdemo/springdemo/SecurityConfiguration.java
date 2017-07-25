package com.aquaq.tinpui.springdemo.springdemo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;

@Configuration
// Tell Spring Boot to drop its autoconfigured security policy and use this one instead.
@EnableWebSecurity
// Turn on method-level security with Spring Security's sophisticated @Pre and @Post annotations.
@EnableGlobalMethodSecurity(prePostEnabled = true)
// Extend WebSecurityConfigurerAdapter, a handy base class to write policy,
public class SecurityConfiguration extends WebSecurityConfigurerAdapter {

    @Autowired
    private SpringDataJpaUserDetailsService userDetailsService;

    @Override
    // It autowired the SpringDataJpaUserDetailsService by field inject and
    // then plugs it in via the configure(AuthenticationManagerBuilder) method.
    // The PASSWORD_ENCODER from Manager is also setup.
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth
                .userDetailsService(this.userDetailsService)
                .passwordEncoder(Manager.PASSWORD_ENCODER);
    }

    @Override
    // The pivotal security policy is written in pure Java with the configure(HttpSecurity).
    // The security policy says to authorize all requests using the access rules defined earlier.
    protected void configure(HttpSecurity http) throws Exception {
        http
                .authorizeRequests()
                // Paths listed here are granted unconditional access since there is no reason
                // to block static web resources.
                .antMatchers("/built/**", "/main.css").permitAll()
                // Anything that doesn't match that will require authentication.
                .anyRequest().authenticated()
                .and()
                // Use form-based authentication.
                .formLogin()
                // Default to "/" upon success.
                .defaultSuccessUrl("/", true)
                // Grant access to the login page.
                .permitAll()
                .and()
                /*
                Configure a BASIC login with CSRF disabled. This is for demo purposes,
                not recommended for production systems without careful analysis.
                Note that authenticating with any mechanism over HTTP (not HTTPS) puts
                your credentials at risk of being sniffed over the wire.
                */
                .httpBasic()
                .and()
                .csrf().disable()
                .logout()
                // Take the user to "/" upon success.
                .logoutSuccessUrl("/");
    }

}
