package br.com.credup.auth.repository;

import br.com.credup.auth.domain.SessaoAtualizacao;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.*;

public interface RepositorioSessaoAtualizacao extends JpaRepository<SessaoAtualizacao, UUID> {
    Optional<SessaoAtualizacao> findByTokenHash(String tokenHash);

    @Modifying
    @Query("update SessaoAtualizacao s set s.revogadoEm = :agora where s.familiaId = :familia and s.revogadoEm is null")
    int revogarFamilia(@Param("familia") UUID familia, @Param("agora") Instant agora);

    @Modifying
    @Query("update SessaoAtualizacao s set s.revogadoEm = :agora where s.usuario.id = :usuario and s.revogadoEm is null")
    int revogarDoUsuario(@Param("usuario") UUID usuario, @Param("agora") Instant agora);
}
