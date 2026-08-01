package br.com.credup.identity.application;

import br.com.credup.audit.domain.RegistroAuditoria;
import br.com.credup.audit.repository.RepositorioRegistroAuditoria;
import br.com.credup.billing.application.ServicoAssinatura;
import br.com.credup.identity.api.DtosFuncionario.*;
import br.com.credup.identity.domain.*;
import br.com.credup.identity.repository.*;
import br.com.credup.shared.domain.PerfilAcesso;
import br.com.credup.shared.exception.ExcecaoApi;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.util.*;

@Service
public class ServicoFuncionario {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    private final RepositorioUsuario users;
    private final RepositorioComerciante merchants;
    private final RepositorioFuncionarioComercio staffRepository;
    private final PasswordEncoder codificador;
    private final RepositorioRegistroAuditoria auditLogs;
    private final ServicoAssinatura assinaturas;

    public ServicoFuncionario(RepositorioUsuario users, RepositorioComerciante merchants,
            RepositorioFuncionarioComercio staffRepository, PasswordEncoder codificador,
            RepositorioRegistroAuditoria auditLogs, ServicoAssinatura assinaturas) {
        this.users = users;
        this.merchants = merchants;
        this.staffRepository = staffRepository;
        this.codificador = codificador;
        this.auditLogs = auditLogs;
        this.assinaturas = assinaturas;
    }

    @Transactional
    public RespostaFuncionarioCriado create(Usuario current, SolicitacaoCriacaoFuncionario request) {
        assinaturas.exigirAcessoOperacional(current);
        Comerciante owner = owner(current);
        if (users.existsByEmailIgnoreCase(request.email()))
            throw new ExcecaoApi(HttpStatus.CONFLICT, "E-mail já cadastrado");
        if (users.existsByCpf(request.cpf()))
            throw new ExcecaoApi(HttpStatus.CONFLICT, "CPF já cadastrado");
        if (request.dataNascimento() != null
                && request.dataNascimento().isAfter(LocalDate.now().minusYears(18)))
            throw new ExcecaoApi(HttpStatus.UNPROCESSABLE_ENTITY,
                    "O usuário deve ter pelo menos 18 anos");
        String senha = senhaTemporaria();
        var employee = new FuncionarioComercio();
        employee.setName(request.nome().trim());
        employee.setSurname(request.sobrenome().trim());
        employee.setTelephone(request.telefone());
        employee.setCpf(request.cpf());
        employee.setEmail(request.email().trim().toLowerCase());
        employee.setDateBirth(request.dataNascimento());
        employee.setSenha(codificador.encode(senha));
        employee.setPerfilAcesso(PerfilAcesso.MERCHANT_STAFF);
        employee.setResponsavel(owner);
        employee.setDeveAlterarSenha(true);
        employee.setEnabled(true);
        staffRepository.save(employee);
        auditLogs.save(RegistroAuditoria.of(owner, "CREATE_STAFF", "FuncionarioComercio", employee.getId(),
                employee.getName() + " " + employee.getSurname(), "Criou o acesso do funcionário"));
        return new RespostaFuncionarioCriado(map(employee), senha);
    }

    @Transactional(readOnly = true)
    public List<RespostaFuncionario> list(Usuario current) {
        assinaturas.exigirAcessoOperacional(current);
        Comerciante owner = owner(current);
        return staffRepository.findByResponsavelIdOrderByNameAsc(owner.getId()).stream().map(this::map).toList();
    }

    @Transactional
    public RespostaFuncionario changeStatus(Usuario current, UUID id, SolicitacaoStatusFuncionario request) {
        assinaturas.exigirAcessoOperacional(current);
        Comerciante owner = owner(current);
        var employee = findOwned(owner, id);
        employee.setEnabled(request.ativo());
        auditLogs.save(RegistroAuditoria.of(owner, request.ativo() ? "ENABLE_STAFF" : "DISABLE_STAFF",
                "FuncionarioComercio", employee.getId(), employee.getName() + " " + employee.getSurname(),
                request.ativo() ? "Reativou o acesso do funcionário" : "Bloqueou o acesso do funcionário"));
        return map(employee);
    }

    @Transactional
    public RespostaSenhaFuncionario resetSenha(Usuario current, UUID id) {
        assinaturas.exigirAcessoOperacional(current);
        Comerciante owner = owner(current);
        var employee = findOwned(owner, id);
        String senha = senhaTemporaria();
        employee.setSenha(codificador.encode(senha));
        employee.setDeveAlterarSenha(true);
        employee.setEnabled(true);
        auditLogs.save(RegistroAuditoria.of(owner, "RESET_STAFF_PASSWORD", "FuncionarioComercio", employee.getId(),
                employee.getName() + " " + employee.getSurname(),
                "Gerou uma nova senha temporária para o funcionário"));
        return new RespostaSenhaFuncionario(senha);
    }

    @Transactional
    public void delete(Usuario current, UUID id) {
        assinaturas.exigirAcessoOperacional(current);
        Comerciante owner = owner(current);
        var employee = findOwned(owner, id);
        auditLogs.save(RegistroAuditoria.of(owner, "DELETE_STAFF", "FuncionarioComercio", employee.getId(),
                employee.getName() + " " + employee.getSurname(), "Excluiu permanentemente o funcionário"));
        staffRepository.delete(employee);
    }

    private Comerciante owner(Usuario current) {
        if (current.getPerfilAcesso() != PerfilAcesso.MERCHANT_OWNER)
            throw new ExcecaoApi(HttpStatus.FORBIDDEN, "Apenas o dono pode gerenciar funcionários");
        return merchants.findById(current.getId())
                .orElseThrow(() -> new ExcecaoApi(HttpStatus.NOT_FOUND, "Dono não encontrado"));
    }

    private FuncionarioComercio findOwned(Comerciante owner, UUID id) {
        return staffRepository.findByIdAndResponsavelId(id, owner.getId())
                .orElseThrow(() -> new ExcecaoApi(HttpStatus.NOT_FOUND, "Funcionário não encontrado"));
    }

    private RespostaFuncionario map(FuncionarioComercio employee) {
        String cpf = employee.getCpf();
        String phone = employee.getTelephone();
        return new RespostaFuncionario(employee.getId(), employee.getName(), employee.getSurname(),
                mascararEmail(employee.getEmail()), cpf.substring(0, 3) + ".***.***-" + cpf.substring(9),
                "(" + phone.substring(0, 2) + ") *****-" + phone.substring(phone.length() - 4),
                employee.getDateBirth(), employee.isEnabled());
    }

    private String mascararEmail(String email) {
        int separador = email.indexOf('@');
        if (separador <= 0)
            return "***";
        String usuario = email.substring(0, separador);
        return usuario.substring(0, Math.min(2, usuario.length())) + "***" + email.substring(separador);
    }

    private String senhaTemporaria() {
        StringBuilder value = new StringBuilder("Cr3");
        while (value.length() < 10) value.append(CHARS.charAt(RANDOM.nextInt(CHARS.length())));
        return value.toString();
    }
}
