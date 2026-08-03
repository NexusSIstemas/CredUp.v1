package br.com.credup;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AplicacaoCredUp {
    public static void main(String[] args) {
        SpringApplication.run(AplicacaoCredUp.class, args);
    }
}
