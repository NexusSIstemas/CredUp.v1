package br.com.credup.auth.repository;

import br.com.credup.auth.domain.SolicitacaoRedefinicaoSenha;
import br.com.credup.shared.domain.StatusRedefinicaoSenha;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface RepositorioSolicitacaoRedefinicaoSenha extends JpaRepository<SolicitacaoRedefinicaoSenha, UUID> {
    boolean existsByUsuarioIdAndStatus(UUID userId, StatusRedefinicaoSenha status);
    List<SolicitacaoRedefinicaoSenha> findByStatusOrderBySolicitadoEmAsc(StatusRedefinicaoSenha status);
}
