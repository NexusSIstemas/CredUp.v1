package br.com.credup.billing.api;

import br.com.credup.billing.application.ServicoConfiguracaoSistema;
import java.math.BigDecimal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/configuracoes")
public class ControladorConfiguracaoSistema {
    private final ServicoConfiguracaoSistema servico;

    public ControladorConfiguracaoSistema(ServicoConfiguracaoSistema servico) {
        this.servico = servico;
    }

    @GetMapping("/publicas")
    public RespostaConfiguracaoPublica obterPublicas() {
        var configuracao = servico.obter();
        return new RespostaConfiguracaoPublica(
                configuracao.getNomePlano(),
                configuracao.getValorMensal(),
                configuracao.getDiasToleranciaPagamento());
    }

    public record RespostaConfiguracaoPublica(
            String nomePlano,
            BigDecimal valorMensal,
            int diasToleranciaPagamento) {
    }
}
