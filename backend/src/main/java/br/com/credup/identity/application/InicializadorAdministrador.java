package br.com.credup.identity.application;

import br.com.credup.identity.domain.Usuario;
import br.com.credup.identity.repository.RepositorioUsuario;
import br.com.credup.shared.domain.PerfilAcesso;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class InicializadorAdministrador implements ApplicationRunner {
    private final RepositorioUsuario users;
    private final PasswordEncoder codificador;
    private final String email;
    private final String senha;

    public InicializadorAdministrador(RepositorioUsuario users, PasswordEncoder codificador,
            @Value("${ADMIN_EMAIL:admin@credup.local}") String email,
            @Value("${ADMIN_PASSWORD:change-me-now}") String senha) {
        this.users = users;
        this.codificador = codificador;
        this.email = email;
        this.senha = senha;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (users.existsByRole(PerfilAcesso.ADMIN_REDE)) return;
        var admin = new Usuario();
        admin.setName("Administrador");
        admin.setSurname("CredUp");
        admin.setTelephone("00000000000");
        admin.setCpf("00000000000");
        admin.setEmail(email);
        admin.setSenha(codificador.encode(senha));
        admin.setPerfilAcesso(PerfilAcesso.ADMIN_REDE);
        users.save(admin);
    }
}
