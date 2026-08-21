package br.com.credup.billing.repository;

import br.com.credup.billing.domain.PagamentoAssinatura;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface RepositorioPagamentoAssinatura
        extends JpaRepository<PagamentoAssinatura, UUID> {
    boolean existsByReferenciaExterna(String referenciaExterna);

    List<PagamentoAssinatura> findByAssinaturaIdOrderByPagoEmDesc(UUID assinaturaId);

    List<PagamentoAssinatura> findAllByOrderByPagoEmDesc();
}
