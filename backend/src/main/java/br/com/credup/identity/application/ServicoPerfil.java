package br.com.credup.identity.application;

import br.com.credup.audit.domain.RegistroAuditoria;
import br.com.credup.audit.repository.RepositorioRegistroAuditoria;
import br.com.credup.identity.api.DtosPerfil.*;
import br.com.credup.identity.domain.Usuario;
import br.com.credup.identity.repository.RepositorioUsuario;
import br.com.credup.shared.exception.ExcecaoApi;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;

@Service
public class ServicoPerfil {
    private final RepositorioUsuario users;
    private final RepositorioRegistroAuditoria auditLogs;
    private final PasswordEncoder codificador;

    public ServicoPerfil(RepositorioUsuario users, RepositorioRegistroAuditoria auditLogs,
            PasswordEncoder codificador) {
        this.users = users;
        this.auditLogs = auditLogs;
        this.codificador = codificador;
    }

    @Transactional
    public RespostaPerfil get(Usuario current) {
        var user = findCurrent(current);
        auditLogs.save(RegistroAuditoria.of(user, "VIEW_OWN_PROFILE", "Usuario", user.getId(),
                user.getFullname() + " ", "Visualizou as informações do próprio perfil"));
        return map(user);
    }

    @Transactional
    public RespostaPerfil update(Usuario current, SolicitacaoAtualizacaoPerfil request) {
        var user = findCurrent(current);
        validarMaioridade(request.dataNascimento());
        if (request.email() != null && !request.email().isBlank()) {
            users.findByEmailIgnoreCase(request.email()).ifPresent(existing -> {
                if (!existing.getId().equals(user.getId()))
                    throw new ExcecaoApi(HttpStatus.CONFLICT, "E-mail já utilizado por outra conta");
            });
            user.setEmail(request.email().trim().toLowerCase());
        }
        user.setFullname(request.nomeCompleto().trim());
        if (request.telefone() != null && !request.telefone().isBlank())
            user.setTelephone(request.telefone());
        user.setDateBirth(request.dataNascimento());
        if (request.pinRecuperacao() != null && !request.pinRecuperacao().isBlank())
            user.setPinRecuperacaoHash(codificador.encode(request.pinRecuperacao()));
        auditLogs.save(RegistroAuditoria.of(user, "UPDATE_OWN_PROFILE", "Usuario", user.getId(),
                user.getFullname() + " ", request.pinRecuperacao() == null || request.pinRecuperacao().isBlank()
                        ? "Atualizou as informações do próprio perfil"
                        : "Atualizou as informações do próprio perfil e o PIN de recuperação"));
        return map(user);
    }

    private Usuario findCurrent(Usuario current) {
        return users.findById(current.getId())
                .orElseThrow(() -> new ExcecaoApi(HttpStatus.NOT_FOUND, "Usuário não encontrado"));
    }

    private RespostaPerfil map(Usuario user) {
        return new RespostaPerfil(user.getId(), user.getFullname(),
                user.getTelephone(), mascararCpf(user.getCpf()),
                user.getEmail(), user.getDateBirth(), user.getPerfilAcesso(),
                user.possuiPinRecuperacao());
    }

    private void validarMaioridade(LocalDate dataNascimento) {
        if (dataNascimento != null && dataNascimento.isAfter(LocalDate.now().minusYears(18)))
            throw new ExcecaoApi(HttpStatus.UNPROCESSABLE_ENTITY,
                    "O usuário deve ter pelo menos 18 anos");
    }

    private String mascararCpf(String cpf) {
        return cpf.substring(0, 3) + ".***.***-" + cpf.substring(9);
    }

}
