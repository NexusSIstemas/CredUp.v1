package br.com.credup.commerce.repository;

import br.com.credup.commerce.domain.SolicitacaoComercio;
import br.com.credup.shared.domain.StatusComercio;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface RepositorioSolicitacaoComercio
        extends JpaRepository<SolicitacaoComercio, UUID> {
    boolean existsByCnpjAndStatus(String cnpj, StatusComercio status);
    List<SolicitacaoComercio> findByComercianteId(UUID idComerciante);
    List<SolicitacaoComercio> findByStatus(StatusComercio status);
}
