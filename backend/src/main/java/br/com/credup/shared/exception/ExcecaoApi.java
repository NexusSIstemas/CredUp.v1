package br.com.credup.shared.exception;

import org.springframework.http.HttpStatus;

public class ExcecaoApi extends RuntimeException {
    private final HttpStatus status;
    public ExcecaoApi(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }
    public HttpStatus getStatus() {
        return status;
    }
}
