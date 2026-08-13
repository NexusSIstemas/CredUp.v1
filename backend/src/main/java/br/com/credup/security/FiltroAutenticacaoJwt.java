package br.com.credup.security;

import br.com.credup.identity.repository.RepositorioUsuario;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.List;

@Component
public class FiltroAutenticacaoJwt extends OncePerRequestFilter {
    private final ServicoJwt jwtService;
    private final RepositorioUsuario users;

    public FiltroAutenticacaoJwt(ServicoJwt jwtService, RepositorioUsuario users) {
        this.jwtService = jwtService;
        this.users = users;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ") && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                String token = header.substring(7);
                users.findByEmailIgnoreCase(jwtService.subject(token)).ifPresent(user -> {
                    if (!user.isEnabled()) return;
                    if (!jwtService.belongsToCurrentSession(token, user)) return;
                    var authority = new SimpleGrantedAuthority("ROLE_" + user.getPerfilAcesso().name());
                    SecurityContextHolder.getContext().setAuthentication(
                            new UsernamePasswordAuthenticationToken(user, null, List.of(authority)));
                });
            } catch (JwtException | IllegalArgumentException ignored) {
                SecurityContextHolder.clearContext();
            }
        }
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null
                && authentication.getPrincipal() instanceof br.com.credup.identity.domain.Usuario user
                && user.deveAlterarSenha()
                && !request.getRequestURI().equals("/api/auth/change-password")) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Troca de senha obrigatória");
            return;
        }
        chain.doFilter(request, response);
    }
}
