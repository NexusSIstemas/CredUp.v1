package br.com.credup.shared.exception;

import org.springframework.http.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import java.time.Instant;
import java.util.*;

@RestControllerAdvice
public class TratadorGlobalExcecoes {
    private static final Logger LOGGER = LoggerFactory.getLogger(TratadorGlobalExcecoes.class);

    @ExceptionHandler(ExcecaoApi.class)
    ResponseEntity<Map<String, Object>> api(ExcecaoApi ex) {
        return response(ex.getStatus(), ex.getMessage(), Map.of());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<Map<String, Object>> validation(MethodArgumentNotValidException ex) {
        Map<String, String> fields = new LinkedHashMap<>();
        ex.getBindingResult()
                .getFieldErrors()
                .forEach(error -> fields.putIfAbsent(
                        error.getField(),
                        error.getDefaultMessage()));

        String message = fields.values().stream()
                .findFirst()
                .orElse("Verifique os dados informados");
        return response(HttpStatus.BAD_REQUEST, message, fields);
    }

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<Map<String, Object>> accessDenied(AccessDeniedException ex) {
        return response(
                HttpStatus.FORBIDDEN,
                "Você não tem permissão para realizar esta ação",
                Map.of());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<Map<String, Object>> invalidBody(HttpMessageNotReadableException ex) {
        return response(HttpStatus.BAD_REQUEST, "Corpo da requisição inválido", Map.of());
    }

    @ExceptionHandler(NoResourceFoundException.class)
    ResponseEntity<Map<String, Object>> notFound(NoResourceFoundException ex) {
        return response(HttpStatus.NOT_FOUND, "Rota não encontrada", Map.of());
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<Map<String, Object>> unexpected(Exception ex) {
        LOGGER.error("Erro interno não tratado", ex);
        return response(HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno", Map.of());
    }

    private ResponseEntity<Map<String, Object>> response(
            HttpStatus status,
            String message,
            Object details) {

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("dataHora", Instant.now());
        body.put("status", status.value());
        body.put("mensagem", message);
        body.put("detalhes", details);
        return ResponseEntity.status(status).body(body);
    }
}
