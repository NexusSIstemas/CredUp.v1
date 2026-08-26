package br.com.credup.identity.repository;

import br.com.credup.identity.domain.Comerciante;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.UUID;

public interface RepositorioComerciante extends JpaRepository<Comerciante, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select comerciante from Comerciante comerciante where comerciante.id = :id")
    Optional<Comerciante> findByIdForUpdate(@Param("id") UUID id);
}
