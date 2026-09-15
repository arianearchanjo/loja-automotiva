import { describe, expect, it } from "vitest";
import {
  MAX_FAILED_ATTEMPTS,
  registerFailure,
  registerSuccess,
  isBlocked,
  remainingBlockMs,
} from "./login-guard.js";

describe("login-guard (RN02)", () => {
  it("permite login após tentativas abaixo do limite", () => {
    registerFailure("a@b.com");
    expect(isBlocked("a@b.com")).toBe(false);
    expect(remainingBlockMs("a@b.com")).toBe(0);
  });

  it("bloqueia após atingir o número máximo de tentativas", () => {
    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i += 1) {
      registerFailure("block@b.com");
    }
    expect(isBlocked("block@b.com")).toBe(true);
    expect(remainingBlockMs("block@b.com")).toBeGreaterThan(0);
  });

  it("dois registros não bloqueiam (ajuste para MAX_FAILED_ATTEMPTS)", () => {
    registerFailure("two@b.com");
    registerFailure("two@b.com");
    if (MAX_FAILED_ATTEMPTS > 2) {
      expect(isBlocked("two@b.com")).toBe(false);
    }
  });

  it("login com sucesso limpa as tentativas", () => {
    registerFailure("ok@b.com");
    registerFailure("ok@b.com");
    registerSuccess("ok@b.com");
    expect(isBlocked("ok@b.com")).toBe(false);
    expect(remainingBlockMs("ok@b.com")).toBe(0);
  });
});