package br.com.credup.defaults.repository;

import br.com.credup.defaults.domain.Divida;
import org.springframework.data.jpa.repository.*;
import java.util.UUID;

public interface RepositorioDivida extends JpaRepository<Divida, UUID>, JpaSpecificationExecutor<Divida> {
    boolean existsByCommerceId(UUID idComercio);
}
