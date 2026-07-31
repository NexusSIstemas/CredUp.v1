package br.com.credup.identity.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "comerciantes")
public class Comerciante extends Usuario {
}
