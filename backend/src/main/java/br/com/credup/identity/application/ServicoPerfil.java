package br.com.credup.identity.application;

import br.com.credup.audit.domain.RegistroAuditoria;
import br.com.credup.audit.repository.RepositorioRegistroAuditoria;
import br.com.credup.identity.api.DtosPerfil.*;
import br.com.credup.identity.domain.Usuario;
import br.com.credup.identity.repository.RepositorioUsuario;
import br.com.credup.shared.exception.ExcecaoApi;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;

@Service
public class ServicoPerfil {
    private final RepositorioUsuario users;
    private final RepositorioRegistroAuditoria auditLogs;

    public ServicoPerfil(RepositorioUsuario users, RepositorioRegistroAuditoria auditLogs) {
        this.users = users;
        this.auditLogs = auditLogs;
    }

    @Transactional
    public RespostaPerfil get(Usuario current) {
        var user = findCurrent(current);
        auditLogs.save(RegistroAuditoria.of(user, "VIEW_OWN_PROFILE", "Usuario", user.getId(),
                user.getName() + " " + user.getSurname(), "Visualizou as informações do próprio perfil"));
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
        user.setName(request.nome().trim());
        user.setSurname(request.sobrenome().trim());
        if (request.telefone() != null && !request.telefone().isBlank())
            user.setTelephone(request.telefone());
        user.setDateBirth(request.dataNascimento());
        auditLogs.save(RegistroAuditoria.of(user, "UPDATE_OWN_PROFILE", "Usuario", user.getId(),
                user.getName() + " " + user.getSurname(), "Atualizou as informações do próprio perfil"));
        return map(user);
    }

    private Usuario findCurrent(Usuario current) {
        return users.findById(current.getId())
                .orElseThrow(() -> new ExcecaoApi(HttpStatus.NOT_FOUND, "Usuário não encontrado"));
    }

    private RespostaPerfil map(Usuario user) {
        return new RespostaPerfil(user.getId(), user.getName(), user.getSurname(),
                mascararTelefone(user.getTelephone()), mascararCpf(user.getCpf()),
                mascararEmail(user.getEmail()), user.getDateBirth(), user.getPerfilAcesso());
    }

    private void validarMaioridade(LocalDate dataNascimento) {
        if (dataNascimento != null && dataNascimento.isAfter(LocalDate.now().minusYears(18)))
            throw new ExcecaoApi(HttpStatus.UNPROCESSABLE_ENTITY,
                    "O usuário deve ter pelo menos 18 anos");
    }

    private String mascararCpf(String cpf) {
        return cpf.substring(0, 3) + ".***.***-" + cpf.substring(9);
    }

    private String mascararTelefone(String telefone) {
        if (telefone == null || telefone.length() < 10)
            return null;
        return telefone.length() == 11
                ? "(" + telefone.substring(0, 2) + ") *****-" + telefone.substring(7)
                : "(" + telefone.substring(0, 2) + ") ****-" + telefone.substring(6);
    }

    private String mascararEmail(String email) {
        int separador = email.indexOf('@');
        if (separador <= 0)
            return "***";
        String usuario = email.substring(0, separador);
        return usuario.substring(0, Math.min(2, usuario.length())) + "***" + email.substring(separador);
    }
}
