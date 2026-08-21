package br.com.credup.billing.application;

import br.com.credup.audit.repository.RepositorioRegistroAuditoria;
import br.com.credup.billing.domain.Assinatura;
import br.com.credup.billing.domain.ConfiguracaoSistema;
import br.com.credup.billing.domain.PlanoAssinatura;
import br.com.credup.billing.domain.StatusAssinatura;
import br.com.credup.billing.repository.RepositorioAssinatura;
import br.com.credup.identity.domain.Comerciante;
import br.com.credup.shared.domain.PerfilAcesso;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.YearMonth;
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
        assertEquals(
                LocalDate.now().plusMonths(1),
                cenario.assinatura().getProximaCobranca());
    }

    @Test
    void preservaDiaAncoraDepoisDeFevereiro() {
        assertEquals(
                LocalDate.of(2027, 2, 28),
                ServicoAssinatura.calcularVencimento(YearMonth.of(2027, 2), 31));
        assertEquals(
                LocalDate.of(2027, 3, 31),
                ServicoAssinatura.calcularVencimento(YearMonth.of(2027, 3), 31));
    }

    @Test
    void mantemAcessoDuranteTresDiasDeTolerancia() {
        var cenario = criarCenario(
                StatusAssinatura.ATIVA,
                LocalDate.now().minusDays(1));

        var resposta = cenario.servico().minha(cenario.comerciante());

        assertEquals(StatusAssinatura.AGUARDANDO_PAGAMENTO, resposta.status());
        assertTrue(resposta.acessoOperacional());
        assertTrue(resposta.podeGerarRelatorio());
    }

    @Test
    void bloqueiaAcessoNoQuartoDiaSemPagamentoConfirmado() {
        var cenario = criarCenario(
                StatusAssinatura.ATIVA,
                LocalDate.now().minusDays(4));

        var resposta = cenario.servico().minha(cenario.comerciante());

        assertEquals(StatusAssinatura.ATRASADA, resposta.status());
        assertFalse(resposta.acessoOperacional());
        assertFalse(resposta.podeGerarRelatorio());
    }

    private Cenario criarCenario(
            StatusAssinatura status,
            LocalDate vencimento) {
        var repositorio = mock(RepositorioAssinatura.class);
        var auditoria = mock(RepositorioRegistroAuditoria.class);
        var comerciante = new Comerciante();
        comerciante.setName("Comerciante");
        comerciante.setSurname("Teste");
        comerciante.setEmail("comerciante@teste.com");
        comerciante.setPerfilAcesso(PerfilAcesso.MERCHANT_OWNER);

        var assinatura = new Assinatura();
        assinatura.setComerciante(comerciante);
        assinatura.setPlano(PlanoAssinatura.PROFISSIONAL);
        assinatura.setStatus(status);
        assinatura.setProximaCobranca(vencimento);

        when(repositorio.findByComercianteId(comerciante.getId()))
                .thenReturn(Optional.of(assinatura));
        var configuracao = mock(ConfiguracaoSistema.class);
        when(configuracao.getDiasToleranciaPagamento()).thenReturn(3);
        var configuracoes = mock(ServicoConfiguracaoSistema.class);
        when(configuracoes.obter()).thenReturn(configuracao);

        return new Cenario(
                new ServicoAssinatura(repositorio, auditoria, configuracoes),
                comerciante,
                assinatura);
    }

    private record Cenario(
            ServicoAssinatura servico,
            Comerciante comerciante,
            Assinatura assinatura) {
    }
}
