package br.com.credup.commerce.application;

import br.com.credup.commerce.api.DtosComercio.*;
import br.com.credup.commerce.domain.*;
import br.com.credup.commerce.repository.RepositorioComercio;
import br.com.credup.commerce.repository.RepositorioSolicitacaoComercio;
import br.com.credup.defaults.repository.RepositorioDivida;
import br.com.credup.audit.domain.RegistroAuditoria;
import br.com.credup.audit.repository.RepositorioRegistroAuditoria;
import br.com.credup.billing.application.ServicoAssinatura;
import br.com.credup.identity.domain.*;
import br.com.credup.shared.domain.*;
import br.com.credup.shared.exception.ExcecaoApi;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
public class ServicoComercio {
    private final RepositorioComercio commerces;
    private final RepositorioSolicitacaoComercio solicitacoes;
    private final RepositorioDivida dividas;
    private final RepositorioRegistroAuditoria registrosAuditoria;
    private final ServicoAssinatura assinaturas;

    public ServicoComercio(RepositorioComercio commerces,
            RepositorioSolicitacaoComercio solicitacoes,
            RepositorioDivida dividas,
            RepositorioRegistroAuditoria registrosAuditoria,
            ServicoAssinatura assinaturas) {
        this.commerces = commerces;
        this.solicitacoes = solicitacoes;
        this.dividas = dividas;
        this.registrosAuditoria = registrosAuditoria;
        this.assinaturas = assinaturas;
    }

    @Transactional
    public RespostaComercio create(Usuario current, SolicitacaoCriacaoComercio request) {
        if (!(current instanceof Comerciante merchant))
            throw new ExcecaoApi(HttpStatus.FORBIDDEN, "Apenas comerciantes podem cadastrar comércio");
        if (commerces.existsByCnpj(request.cnpj())
                || solicitacoes.existsByCnpjAndStatus(request.cnpj(), StatusComercio.PENDING))
            throw new ExcecaoApi(HttpStatus.CONFLICT, "CNPJ já cadastrado");
        var address = new Endereco();
        address.setRoad(request.endereco().rua());
        address.setCity(request.endereco().cidade());
        address.setCep(request.endereco().cep());
        address.setNumberComercio(request.endereco().numberComercio());
        address.setReferencePoint(request.endereco().pontoReferencia());
        var solicitacao = new SolicitacaoComercio();
        solicitacao.setNomeComercio(request.nomeComercio().trim());
        solicitacao.setCnpj(request.cnpj());
        solicitacao.setEndereco(address);
        solicitacao.setComerciante(merchant);
        solicitacoes.save(solicitacao);
        registrosAuditoria.save(RegistroAuditoria.of(current, "SOLICITAR_CADASTRO_COMERCIO",
                "SolicitacaoComercio", solicitacao.getId(), solicitacao.getNomeComercio(),
                "Enviou uma solicitação de cadastro de comércio para aprovação"));
        return map(solicitacao);
    }

    @Transactional(readOnly = true)
    public List<RespostaComercio> list(Usuario current, StatusComercio status) {
        List<Comercio> result = current.getPerfilAcesso() == PerfilAcesso.ADMIN_REDE
                ? (status == null ? commerces.findAll() : commerces.findByStatus(status))
                : current instanceof FuncionarioComercio staff
                    ? commerces.findByComercianteId(staff.getResponsavel().getId())
                    : commerces.findByComercianteId(current.getId());
        var respostas = new ArrayList<>(result.stream().map(this::map).toList());
        if (status == null || status != StatusComercio.APPROVED) {
            var pendentes = current.getPerfilAcesso() == PerfilAcesso.ADMIN_REDE
                    ? (status == null ? solicitacoes.findAll() : solicitacoes.findByStatus(status))
                    : current instanceof FuncionarioComercio
                            ? List.<SolicitacaoComercio>of()
                            : solicitacoes.findByComercianteId(current.getId());
            respostas.addAll(pendentes.stream()
                    .filter(item -> status == null || item.getStatus() == status)
                    .map(this::map)
                    .toList());
        }
        return respostas;
    }

    @Transactional
    public RespostaComercio review(Usuario current, UUID id, SolicitacaoRevisao request) {
        if (request.status() == StatusComercio.PENDING)
            throw new ExcecaoApi(HttpStatus.BAD_REQUEST, "A decisão deve ser APPROVED ou REJECTED");
        var solicitacao = solicitacoes.findById(id)
                .orElseThrow(() -> new ExcecaoApi(
                        HttpStatus.NOT_FOUND,
                        "Solicitação de comércio não encontrada"));
        if (request.status() == StatusComercio.APPROVED) {
            if (commerces.existsByCnpj(solicitacao.getCnpj()))
                throw new ExcecaoApi(HttpStatus.CONFLICT, "CNPJ já cadastrado");
            var commerce = new Comercio();
            commerce.setComercioName(solicitacao.getNomeComercio());
            commerce.setCnpj(solicitacao.getCnpj());
            commerce.setEndereco(solicitacao.getEndereco());
            commerce.setComerciante(solicitacao.getComerciante());
            commerce.setStatus(StatusComercio.APPROVED);
            commerces.save(commerce);
            solicitacoes.delete(solicitacao);
            assinaturas.liberarPagamento(commerce.getComerciante());
            registrosAuditoria.save(RegistroAuditoria.of(current, "APROVAR_CADASTRO_COMERCIO",
                    "Comercio", commerce.getId(), commerce.getComercioName(),
                    "Aprovou a solicitação e criou o comércio na rede"));
            return map(commerce);
        }
        solicitacao.setStatus(StatusComercio.REJECTED);
        registrosAuditoria.save(RegistroAuditoria.of(current, "REJEITAR_CADASTRO_COMERCIO",
                "SolicitacaoComercio", solicitacao.getId(), solicitacao.getNomeComercio(),
                "Rejeitou a solicitação de cadastro do comércio"));
        return map(solicitacao);
    }

    @Transactional
    public RespostaComercio update(Usuario current, UUID id, SolicitacaoAtualizacaoComercio request) {
        assinaturas.exigirGerenciamentoComercio(current);
        var commerce = get(id);
        requireAccess(current, commerce);
        if (current.getPerfilAcesso() != PerfilAcesso.MERCHANT_OWNER)
            throw new ExcecaoApi(HttpStatus.FORBIDDEN, "Apenas o dono pode editar o comércio");
        commerce.setComercioName(request.nomeComercio().trim());
        var address = commerce.getEndereco();
        address.setRoad(request.endereco().rua().trim());
        address.setCity(request.endereco().cidade().trim());
        address.setCep(request.endereco().cep());
        address.setNumberComercio(request.endereco().numberComercio().trim());
        address.setReferencePoint(request.endereco().pontoReferencia());
        registrosAuditoria.save(RegistroAuditoria.of(current, "EDITAR_COMERCIO", "Comercio", commerce.getId(),
                commerce.getComercioName(), "Atualizou o nome ou endereço do comércio"));
        return map(commerce);
    }

    @Transactional
    public void delete(Usuario current, UUID id) {
        assinaturas.exigirGerenciamentoComercio(current);
        var commerce = get(id);
        requireAccess(current, commerce);
        if (current.getPerfilAcesso() != PerfilAcesso.MERCHANT_OWNER)
            throw new ExcecaoApi(HttpStatus.FORBIDDEN, "Apenas o dono pode excluir o comércio");
        if (dividas.existsByCommerceId(id))
            throw new ExcecaoApi(HttpStatus.CONFLICT,
                    "O comércio possui dívidas vinculadas e não pode ser excluído");
        registrosAuditoria.save(RegistroAuditoria.of(current, "EXCLUIR_COMERCIO", "Comercio", commerce.getId(),
                commerce.getComercioName(), "Excluiu permanentemente o comércio sem histórico de dívidas"));
        commerces.delete(commerce);
    }

    @Transactional(readOnly = true)
    public Comercio get(UUID id) {
        return commerces.findById(id).orElseThrow(() -> new ExcecaoApi(HttpStatus.NOT_FOUND, "Comércio não encontrado"));
    }

    public void requireAccess(Usuario current, Comercio commerce) {
        UUID ownerId = current instanceof FuncionarioComercio staff
                ? staff.getResponsavel().getId()
                : current.getId();
        if (current.getPerfilAcesso() != PerfilAcesso.ADMIN_REDE && !commerce.getComerciante().getId().equals(ownerId))
            throw new ExcecaoApi(HttpStatus.FORBIDDEN, "Sem acesso a este comércio");
    }

    @Transactional(readOnly = true)
    public void exigirComercioAprovadoParaConsulta(Usuario usuario) {
        if (usuario.getPerfilAcesso() == PerfilAcesso.MERCHANT_OWNER
                && !commerces.existsByComercianteIdAndStatus(
                        usuario.getId(),
                        StatusComercio.APPROVED)) {
            throw new ExcecaoApi(
                    HttpStatus.FORBIDDEN,
                    "Aguarde a aprovação de pelo menos um comércio antes de consultar inadimplentes");
        }
    }

    private RespostaComercio map(Comercio c) {
        var a = c.getEndereco();
        return new RespostaComercio(c.getId(), c.getComercioName(), c.getCnpj(),
                new SolicitacaoEndereco(a.getRoad(), a.getCity(), a.getCep(), a.getNumberComercio(), a.getReferencePoint()),
                c.getComerciante().getId(), c.getStatus());
    }

    private RespostaComercio map(SolicitacaoComercio solicitacao) {
        var endereco = solicitacao.getEndereco();
        return new RespostaComercio(
                solicitacao.getId(),
                solicitacao.getNomeComercio(),
                solicitacao.getCnpj(),
                new SolicitacaoEndereco(endereco.getRoad(), endereco.getCity(), endereco.getCep(),
                        endereco.getNumberComercio(), endereco.getReferencePoint()),
                solicitacao.getComerciante().getId(),
                solicitacao.getStatus());
    }
}
