package br.com.credup.defaults.application;

import br.com.credup.audit.repository.RepositorioRegistroAuditoria;
import br.com.credup.commerce.application.ServicoComercio;
import br.com.credup.commerce.domain.Comercio;
import br.com.credup.defaults.domain.Divida;
import br.com.credup.defaults.domain.ClienteInadimplente;
import br.com.credup.defaults.repository.*;
import br.com.credup.identity.domain.Comerciante;
import br.com.credup.shared.domain.StatusDivida;
import br.com.credup.shared.domain.PerfilAcesso;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ServicoInadimplenciaTest {
    @Test
    void masksCpfInNetworkResponses() {
        assertEquals("123.***.***-01", ServicoInadimplencia.mask("12345678901"));
    }

    @Test
    void settlementChangesStatusWithoutDeletingDivida() {
        var clients = mock(RepositorioClienteInadimplente.class);
        var debts = mock(RepositorioDivida.class);
        var commerces = mock(ServicoComercio.class);
        var audit = mock(RepositorioRegistroAuditoria.class);
        var subscriptions = mock(br.com.credup.billing.application.ServicoAssinatura.class);
        var service = new ServicoInadimplencia(clients, debts, commerces, audit, subscriptions);
        var merchant = mock(Comerciante.class);
        UUID merchantId = UUID.randomUUID();
        when(merchant.getId()).thenReturn(merchantId);
        when(merchant.getPerfilAcesso()).thenReturn(PerfilAcesso.MERCHANT_OWNER);
        when(merchant.getName()).thenReturn("Comerciante");
        when(merchant.getSurname()).thenReturn("Teste");
        var commerce = mock(Comercio.class);
        when(commerce.getComerciante()).thenReturn(merchant);
        var client = mock(ClienteInadimplente.class);
        when(client.getCpf()).thenReturn("12345678901");
        var debt = new Divida();
        debt.setComercio(commerce);
        debt.setClient(client);
        debt.setStatus(StatusDivida.NEGOTIATING);
        UUID id = UUID.randomUUID();
        when(debts.findById(id)).thenReturn(Optional.of(debt));

        service.settle(merchant, id);
        assertEquals(StatusDivida.PAID, debt.getStatus());
        verify(debts, never()).deleteById(any());
    }
}
