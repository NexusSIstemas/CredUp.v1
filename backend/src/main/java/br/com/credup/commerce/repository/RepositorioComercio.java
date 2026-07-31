package br.com.credup.commerce.repository;

import br.com.credup.commerce.domain.Comercio;
import br.com.credup.shared.domain.StatusComercio;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface RepositorioComercio extends JpaRepository<Comercio, UUID> {
    boolean existsByCnpj(String cnpj);
    boolean existsByComercianteIdAndStatus(UUID idComerciante, StatusComercio status);
    List<Comercio> findByComercianteId(UUID merchantId);
    List<Comercio> findByStatus(StatusComercio status);
    Optional<Comercio> findByCnpjAndComercianteId(String cnpj, UUID merchantId);
    Optional<Comercio> findByCommerceNameIgnoreCaseAndComercianteId(String nomeComercio, UUID idComerciante);
}
