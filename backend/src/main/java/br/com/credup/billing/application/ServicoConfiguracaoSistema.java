package br.com.credup.billing.application;

import br.com.credup.billing.domain.ConfiguracaoSistema;
import br.com.credup.billing.repository.RepositorioConfiguracaoSistema;
import br.com.credup.shared.exception.ExcecaoApi;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ServicoConfiguracaoSistema {
    private final RepositorioConfiguracaoSistema configuracoes;

    public ServicoConfiguracaoSistema(
            RepositorioConfiguracaoSistema configuracoes) {
        this.configuracoes = configuracoes;
    }

    @Transactional(readOnly = true)
    public ConfiguracaoSistema obter() {
        return configuracoes.findAll().stream()
                .findFirst()
                .orElseThrow(() -> new ExcecaoApi(
                        HttpStatus.SERVICE_UNAVAILABLE,
                        "Configuração comercial indisponível"));
    }
}
