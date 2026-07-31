package br.com.credup.audit.repository;

import br.com.credup.audit.domain.RegistroAuditoria;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface RepositorioRegistroAuditoria extends JpaRepository<RegistroAuditoria, UUID> {
    List<RegistroAuditoria> findTop200ByOrderByTimestampDesc();
    List<RegistroAuditoria> findByTimestampAfterOrderByTimestampAsc(Instant desde);
}
