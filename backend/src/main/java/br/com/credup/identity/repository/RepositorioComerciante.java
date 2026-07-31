package br.com.credup.identity.repository;

import br.com.credup.identity.domain.Comerciante;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface RepositorioComerciante extends JpaRepository<Comerciante, UUID> {
}
