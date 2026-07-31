package br.com.credup.identity.repository;

import br.com.credup.identity.domain.Usuario;
import br.com.credup.shared.domain.PerfilAcesso;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface RepositorioUsuario extends JpaRepository<Usuario, UUID> {
    Optional<Usuario> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByCpf(String cpf);
    boolean existsByRole(PerfilAcesso perfilAcesso);
    Optional<Usuario> findByCpfAndTelephone(String cpf, String telephone);
}
