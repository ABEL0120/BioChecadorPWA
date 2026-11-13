import { describe, it, expect } from "vitest";
import { extraerTokenChecadorFisico } from "./checadorFisicoHelper";

describe("extraerTokenChecadorFisico", () => {
  it("extrae token desde string plano", () => {
    expect(extraerTokenChecadorFisico("ABC123XYZ")).toBe("ABC123XYZ");
  });

  it("extrae token desde json con tokenChecadorFisico", () => {
    const json = JSON.stringify({ tokenChecadorFisico: "MI_TOKEN_TOTP" });
    expect(extraerTokenChecadorFisico(json)).toBe("MI_TOKEN_TOTP");
  });

  it("extrae token desde json con propiedad token", () => {
    const json = JSON.stringify({ token: "TOKEN_JSON_1" });
    expect(extraerTokenChecadorFisico(json)).toBe("TOKEN_JSON_1");
  });

  it("extrae token desde URL con parametro token", () => {
    const url = "https://example.com/checador-fisico?token=TOKEN_DESDE_URL";
    expect(extraerTokenChecadorFisico(url)).toBe("TOKEN_DESDE_URL");
  });

  it("extrae token desde URL con parametro tokenChecadorFisico", () => {
    const url = "https://example.com/checador-fisico?tokenChecadorFisico=TOKEN_FIDO";
    expect(extraerTokenChecadorFisico(url)).toBe("TOKEN_FIDO");
  });

  it("extrae token desde query string con parametro t", () => {
    const query = "?t=TOKEN_CORTO";
    expect(extraerTokenChecadorFisico(query)).toBe("TOKEN_CORTO");
  });

  it("retorna string vacio para entrada vacia", () => {
    expect(extraerTokenChecadorFisico("")).toBe("");
    expect(extraerTokenChecadorFisico("   ")).toBe("");
  });
});

