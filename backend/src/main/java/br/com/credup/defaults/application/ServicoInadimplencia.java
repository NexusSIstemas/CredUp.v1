package br.com.credup.defaults.application;

import br.com.credup.audit.domain.RegistroAuditoria;
import br.com.credup.audit.repository.RepositorioRegistroAuditoria;
import br.com.credup.commerce.application.ServicoComercio;
import br.com.credup.billing.application.ServicoAssinatura;
import br.com.credup.defaults.api.DtosInadimplencia.*;
import br.com.credup.defaults.domain.*;
import br.com.credup.defaults.repository.*;
import br.com.credup.identity.domain.Usuario;
import br.com.credup.shared.domain.*;
import br.com.credup.shared.exception.ExcecaoApi;
import jakarta.persistence.criteria.Predicate;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
public class ServicoInadimplencia {
    private final RepositorioClienteInadimplente clients;
    private final RepositorioDivida debts;
    private final ServicoComercio commerceService;
    private final RepositorioRegistroAuditoria auditLogs;
    private final ServicoAssinatura assinaturas;

    public ServicoInadimplencia(RepositorioClienteInadimplente clients, RepositorioDivida debts, ServicoComercio commerceService,
                          RepositorioRegistroAuditoria auditLogs, ServicoAssinatura assinaturas) {
        this.clients = clients;
        this.debts = debts;
        this.commerceService = commerceService;
        this.auditLogs = auditLogs;
        this.assinaturas = assinaturas;
    }

    @Transactional
    public RespostaDivida create(Usuario current, SolicitacaoCriacaoDivida request) {
        assinaturas.exigirAcessoOperacional(current);
        var commerce = commerceService.get(request.idComercio());
        commerceService.requireAccess(current, commerce);
        if (commerce.getStatus() != StatusComercio.APPROVED)
            throw new ExcecaoApi(HttpStatus.UNPROCESSABLE_ENTITY, "O comércio precisa estar aprovado");
        if (request.dataDivida().isBefore(LocalDate.of(2000, 1, 1)))
            throw new ExcecaoApi(HttpStatus.UNPROCESSABLE_ENTITY,
                    "A data da dívida deve ser a partir de 01/01/2000");
        var client = clients.findByCpf(request.cliente().cpf())
                .map(existing -> addNicknameWhenMissing(existing, request.cliente().apelido()))
                .orElseGet(() -> createClient(request.cliente()));
        var debt = new Divida();
        debt.setClient(client);
        debt.setComercio(commerce);
        debt.setDividaValue(request.valorDivida());
        debt.setDateValue(request.dataDivida());
        debt.setDescription(request.descricao());
        debt.setHasInterest(request.possuiJuros());
        debt.setInterestRate(request.possuiJuros() ? request.taxaJuros() : null);
        debts.save(debt);
        auditLogs.save(RegistroAuditoria.of(current, "CRIAR_DIVIDA", "Divida", debt.getId(),
                client.getName() + " " + client.getSurname(),
                "Cadastrou uma dívida no comércio " + commerce.getComercioName()));
        return map(debt, current);
    }

    private ClienteInadimplente createClient(SolicitacaoCliente request) {
        var client = new ClienteInadimplente();
        client.setName(request.nome());
        client.setSurname(request.sobrenome());
        client.setNickname(normalizeNickname(request.apelido()));
        client.setCpf(request.cpf());
        client.setTelephone(request.telefone());
        client.setResidence(request.residencia());
        client.setDescription(request.descricao());
        try {
            return clients.saveAndFlush(client);
        } catch (DataIntegrityViolationException ex) {
            return clients.findByCpf(request.cpf()).orElseThrow(() -> ex);
        }
    }

    private ClienteInadimplente addNicknameWhenMissing(
            ClienteInadimplente client,
            String nickname) {
        var normalizedNickname = normalizeNickname(nickname);
        if (client.getNickname() == null && normalizedNickname != null) {
            client.setNickname(normalizedNickname);
        }
        return client;
    }

    private String normalizeNickname(String nickname) {
        if (nickname == null || nickname.isBlank()) {
            return null;
        }
        return nickname.trim();
    }

    @Transactional(readOnly = true)
    public Page<RespostaDivida> list(Usuario current, String search, UUID commerceId, StatusDivida status,
            BigDecimal minValue, BigDecimal maxValue, Pageable pageable) {
        assinaturas.exigirAcessoOperacional(current);
        commerceService.exigirComercioAprovadoParaConsulta(current);
        Specification<Divida> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                var normalizedSearch = search.trim();
                if (normalizedSearch.matches("[\\d.\\-\\s]+")) {
                    var cpfDigits = normalizedSearch.replaceAll("\\D", "");
                    predicates.add(cb.like(
                            root.get("client").get("cpf"),
                            cpfDigits + "%"));
                } else {
                    predicates.add(cb.like(
                            cb.lower(root.get("client").get("nickname")),
                            "%" + normalizedSearch.toLowerCase(Locale.ROOT) + "%"));
                }
            }
            if (commerceId != null) predicates.add(cb.equal(root.get("commerce").get("id"), commerceId));
            if (status != null) predicates.add(cb.equal(root.get("status"), status));
            if (minValue != null) predicates.add(cb.greaterThanOrEqualTo(root.get("debtValue"), minValue));
            if (maxValue != null) predicates.add(cb.lessThanOrEqualTo(root.get("debtValue"), maxValue));
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        return debts.findAll(spec, pageable).map(divida -> map(divida, current));
    }

    @Transactional
    public DetalhesCliente clientDetail(Usuario current, UUID id) {
        assinaturas.exigirAcessoOperacional(current);
        commerceService.exigirComercioAprovadoParaConsulta(current);
        var c = clients.findById(id).orElseThrow(() -> new ExcecaoApi(HttpStatus.NOT_FOUND, "Cliente não encontrado"));
        auditLogs.save(RegistroAuditoria.of(current, "VIEW_FULL_CPF", "ClienteInadimplente", id,
                c.getName() + " " + c.getSurname(), "Consultou os dados detalhados do cliente"));
        return new DetalhesCliente(c.getId(), c.getName(), c.getSurname(), c.getNickname(), mask(c.getCpf()),
                maskPhone(c.getTelephone()), c.getResidence(), c.getDescription());
    }

    @Transactional
    public RespostaDivida settle(Usuario current, UUID id) {
        assinaturas.exigirAcessoOperacional(current);
        var debt = debts.findById(id).orElseThrow(() -> new ExcecaoApi(HttpStatus.NOT_FOUND, "Dívida não encontrada"));
        commerceService.requireAccess(current, debt.getComercio());
        if (debt.getStatus() == StatusDivida.PAID || debt.getStatus() == StatusDivida.CANCELED)
            throw new ExcecaoApi(HttpStatus.CONFLICT, "A dívida já está encerrada");
        debt.setStatus(StatusDivida.PAID);
        auditLogs.save(RegistroAuditoria.of(current, "DAR_BAIXA_DIVIDA", "Divida", debt.getId(),
                debt.getClient().getName() + " " + debt.getClient().getSurname(),
                "Deu baixa na dívida do comércio " + debt.getComercio().getComercioName()));
        return map(debt, current);
    }

    private RespostaDivida map(Divida d) {
        return map(d, null);
    }

    private RespostaDivida map(Divida d, Usuario current) {
        var c = d.getClient();
        boolean podeDarBaixa = current != null
                && current.getPerfilAcesso() == PerfilAcesso.MERCHANT_OWNER
                && d.getComercio().getComerciante().getId().equals(current.getId());
        return new RespostaDivida(d.getId(),
                new ResumoCliente(c.getId(), c.getName(), c.getSurname(), c.getNickname(), mask(c.getCpf())),
                d.getComercio().getId(), d.getComercio().getComercioName(), d.getDividaValue(),
                d.getDateValue(), d.getCreatedAt(), d.getDescription(), d.isHasInterest(), d.getInterestRate(), d.getStatus(),
                podeDarBaixa);
    }

    static String mask(String cpf) {
        return cpf.substring(0, 3) + ".***.***-" + cpf.substring(9, 11);
    }

    static String maskPhone(String telefone) {
        if (telefone == null || telefone.length() < 10)
            return null;
        return telefone.length() == 11
                ? "(" + telefone.substring(0, 2) + ") *****-" + telefone.substring(7)
                : "(" + telefone.substring(0, 2) + ") ****-" + telefone.substring(6);
    }
}
