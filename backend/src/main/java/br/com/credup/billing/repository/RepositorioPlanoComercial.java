package br.com.credup.billing.repository;

import br.com.credup.billing.domain.PlanoComercial;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface RepositorioPlanoComercial extends JpaRepository<PlanoComercial, UUID> {
    Optional<PlanoComercial> findByCodigoAndAtivoTrue(String codigo);
    List<PlanoComercial> findByAtivoTrueOrderByOrdemExibicaoAsc();
}
