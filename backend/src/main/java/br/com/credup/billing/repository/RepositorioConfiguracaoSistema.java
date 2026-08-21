package br.com.credup.billing.repository;

import br.com.credup.billing.domain.ConfiguracaoSistema;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface RepositorioConfiguracaoSistema
        extends JpaRepository<ConfiguracaoSistema, UUID> {
}
