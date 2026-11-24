package br.com.credup.billing.application;

import br.com.credup.audit.repository.RepositorioRegistroAuditoria;
import br.com.credup.billing.domain.Assinatura;
import br.com.credup.billing.domain.PlanoComercial;
import br.com.credup.billing.domain.StatusAssinatura;
import br.com.credup.billing.repository.RepositorioAssinatura;
import br.com.credup.identity.domain.Comerciante;
import br.com.credup.shared.domain.PerfilAcesso;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ServicoAssinaturaTest {
    @Test
    void pagamentoAtivaAssinaturaPorUmMesAPartirDaContratacao() {
        var cenario = criarCenario(StatusAssinatura.AGUARDANDO_PAGAMENTO, null);
        cenario.assinatura().setPixTxid("ORD12345678901234567890");

        cenario.servico().confirmarPagamentoPix(
                cenario.comerciante(),
                "ORD12345678901234567890");

        assertEquals(StatusAssinatura.ATIVA, cenario.assinatura().getStatus());
        assertTrue(cenario.assinatura().getProximaCobranca().isAfter(Instant.now()));
    }

    @Test
    void preservaDiaEHorarioDeCobrancaDepoisDeFevereiro() {
        assertEquals(
                Instant.parse("2027-02-28T17:42:10Z"),
                ServicoAssinatura.calcularProximoVencimento(
                        Instant.parse("2027-01-31T17:42:10Z"),
                        31));
        assertEquals(
                Instant.parse("2027-03-31T17:42:10Z"),
                ServicoAssinatura.calcularProximoVencimento(
                        Instant.parse("2027-02-28T17:42:10Z"),
                        31));
    }

    @Test
    void mantemAcessoAteOInstanteExatoDoVencimento() {
        var vencimento = Instant.parse("2026-12-20T14:32:10Z");

        assertTrue(ServicoAssinatura.acessoEstaVigente(vencimento, vencimento));
    }

    @Test
    void bloqueiaAcessoUmSegundoAposOVencimento() {
        var vencimento = Instant.parse("2026-12-20T14:32:10Z");

        assertFalse(ServicoAssinatura.acessoEstaVigente(
                vencimento,
                vencimento.plusSeconds(1)));
    }

    @Test
    void bloqueiaAcessoAssimQueOVencimentoPassa() {
        var cenario = criarCenario(
                StatusAssinatura.ATIVA,
                Instant.now().minusSeconds(1));

        var resposta = cenario.servico().minha(cenario.comerciante());

        assertEquals(StatusAssinatura.ATRASADA, resposta.status());
        assertFalse(resposta.acessoOperacional());
        assertFalse(resposta.podeGerarRelatorio());
    }

    private Cenario criarCenario(
            StatusAssinatura status,
            Instant vencimento) {
        var repositorio = mock(RepositorioAssinatura.class);
        var auditoria = mock(RepositorioRegistroAuditoria.class);
        var comerciante = new Comerciante();
        comerciante.setFullname("Comerciante");
        comerciante.setEmail("comerciante@teste.com");
        comerciante.setPerfilAcesso(PerfilAcesso.MERCHANT_OWNER);

        var assinatura = new Assinatura();
        assinatura.setComerciante(comerciante);
        var plano = mock(PlanoComercial.class);
        when(plano.isRelatoriosCompletos()).thenReturn(true);
        when(plano.getMesesHistorico()).thenReturn(24);
        assinatura.setPlano(plano);
        assinatura.setStatus(status);
        assinatura.setProximaCobranca(vencimento);

        when(repositorio.findByComercianteId(comerciante.getId()))
                .thenReturn(Optional.of(assinatura));
        return new Cenario(
                new ServicoAssinatura(
                        repositorio,
                        mock(br.com.credup.billing.repository.RepositorioPagamentoAssinatura.class),
                        mock(br.com.credup.billing.repository.RepositorioPlanoComercial.class),
                        auditoria),
                comerciante,
                assinatura);
    }

    private record Cenario(
            ServicoAssinatura servico,
            Comerciante comerciante,
            Assinatura assinatura) {
    }
}
