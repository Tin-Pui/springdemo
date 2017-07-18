package com.aquaq.tinpui.springdemo.springdemo;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

// @Controller marks this class as a Spring MVC controller.
@Controller
public class HomeController {

    // @RequestMapping flags the index() method to support the '/' route.
    // Returns "index" for the template, Spring boot's autoconfigured view
    // resolver will map this to src/main/resources/templates/index.html
    @RequestMapping(value = "/")
    public String index() {
        return "index";
    }

}