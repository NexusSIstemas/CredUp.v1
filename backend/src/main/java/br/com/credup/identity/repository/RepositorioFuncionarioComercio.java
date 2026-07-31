package br.com.credup.identity.repository;

import br.com.credup.identity.domain.FuncionarioComercio;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface RepositorioFuncionarioComercio extends JpaRepository<FuncionarioComercio, UUID> {
    List<FuncionarioComercio> findByResponsavelIdOrderByNameAsc(UUID responsavelId);
    Optional<FuncionarioComercio> findByIdAndResponsavelId(UUID id, UUID responsavelId);
}
