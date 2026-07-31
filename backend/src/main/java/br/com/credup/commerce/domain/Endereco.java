package br.com.credup.commerce.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class Endereco {
    @Column(name = "rua")
    private String road;
    @Column(name = "cidade")
    private String city;
    private String cep;
    @Column(name = "numero_comercio")
    private String numberComercio;
    @Column(name = "ponto_referencia")
    private String referencePoint;

    public String getRoad() {
        return road;
    }

    public void setRoad(String road) {
        this.road = road;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getCep() {
        return cep;
    }

    public void setCep(String cep) {
        this.cep = cep;
    }

    public String getNumberComercio() {
        return numberComercio;
    }

    public void setNumberComercio(String numberComercio) {
        this.numberComercio = numberComercio;
    }

    public String getReferencePoint() {
        return referencePoint;
    }

    public void setReferencePoint(String referencePoint) {
        this.referencePoint = referencePoint;
    }
}
