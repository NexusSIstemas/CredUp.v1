package br.com.credup.auth.application;

import br.com.credup.auth.api.DtosAutenticacao.SolicitacaoCadastro;
import br.com.credup.identity.repository.*;
import br.com.credup.security.ServicoJwt;
import br.com.credup.shared.exception.ExcecaoApi;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class ServicoAutenticacaoTest {
    @Test
    void refusesDuplicatedCpf() {
        var users = mock(RepositorioUsuario.class);
        when(users.existsByCpf("12345678901")).thenReturn(true);
        var service = new ServicoAutenticacao(users, mock(RepositorioComerciante.class),
                mock(PasswordEncoder.class), mock(ServicoJwt.class),
                mock(br.com.credup.commerce.repository.RepositorioComercio.class),
                mock(br.com.credup.auth.repository.RepositorioSolicitacaoRedefinicaoSenha.class),
                mock(br.com.credup.billing.application.ServicoAssinatura.class));
        var request = new SolicitacaoCadastro("Ana", "Silva", "11999999999", "12345678901",
                "ana@example.com", "password123", "482917", null);
        assertThrows(ExcecaoApi.class, () -> service.register(request));
    }
}
