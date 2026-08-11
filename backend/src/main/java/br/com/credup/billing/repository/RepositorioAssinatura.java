package br.com.credup.billing.repository;

import br.com.credup.billing.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface RepositorioAssinatura extends JpaRepository<Assinatura, UUID> {
    Optional<Assinatura> findByComercianteId(UUID comercianteId);
    Optional<Assinatura> findByPixTxid(String pixTxid);
    List<Assinatura> findAllByOrderByCreatedAtDesc();
}
