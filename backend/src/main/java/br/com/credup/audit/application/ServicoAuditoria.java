package br.com.credup.audit.application;

import br.com.credup.audit.domain.RegistroAuditoria;
import br.com.credup.audit.repository.RepositorioRegistroAuditoria;
import br.com.credup.identity.domain.Usuario;
import br.com.credup.shared.domain.PerfilAcesso;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ServicoAuditoria {
    private final RepositorioRegistroAuditoria repositorio;

    public ServicoAuditoria(RepositorioRegistroAuditoria repositorio) {
        this.repositorio = repositorio;
    }

    @Transactional
    public void registrar(Usuario autor, String acao, String entidadeAlvo, UUID alvoId,
            String descricaoAlvo, String detalhes) {
        repositorio.save(RegistroAuditoria.of(
                autor, acao, entidadeAlvo, alvoId, descricaoAlvo, detalhes));
    }

    @Transactional(readOnly = true)
    public List<RespostaRegistroAuditoria> listar(Instant desde) {
        List<RegistroAuditoria> registros = desde == null
                ? repositorio.findTop200ByOrderByTimestampDesc()
                : repositorio.findByTimestampAfterOrderByTimestampAsc(desde);
        return registros.stream().map(this::mapear).toList();
    }

    private RespostaRegistroAuditoria mapear(RegistroAuditoria registro) {
        var usuario = registro.getUsuario();
        String nomeAutor = registro.getAutorNome() != null
                ? registro.getAutorNome()
                : usuario.getFullname() + " ";
        PerfilAcesso perfilAutor = registro.getAutorPerfil() != null
                ? PerfilAcesso.valueOf(registro.getAutorPerfil())
                : usuario.getPerfilAcesso();
        return new RespostaRegistroAuditoria(
                registro.getId(),
                registro.getDataHora(),
                registro.getAcao(),
                registro.getEntidadeAlvo(),
                registro.getAlvoId(),
                usuario.getId(),
                nomeAutor,
                perfilAutor,
                registro.getAlvoDescricao(),
                registro.getDetalhes());
    }

    public record RespostaRegistroAuditoria(
            UUID id,
            Instant dataHora,
            String acao,
            String entidade,
            UUID alvoId,
            UUID idUsuario,
            String nomeUsuario,
            PerfilAcesso perfilAcesso,
            String alvoDescricao,
            String detalhes) {
    }
}
