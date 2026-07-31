package br.com.credup.defaults.repository;

import br.com.credup.defaults.domain.ClienteInadimplente;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface RepositorioClienteInadimplente extends JpaRepository<ClienteInadimplente, UUID> {
    Optional<ClienteInadimplente> findByCpf(String cpf);
    Page<ClienteInadimplente> findByNameContainingIgnoreCaseOrSurnameContainingIgnoreCase(
            String name, String surname, Pageable pageable);
}
