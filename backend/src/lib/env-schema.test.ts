import { describe, expect, it } from "vitest";
import { envSchema } from "./env-schema.js";

describe("envSchema", () => {
  it("aplica valores padrão para campos opcionais", () => {
    const result = envSchema.parse({
      DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
      BETTER_AUTH_SECRET: "segredo-suficientemente-longo-123",
    });

    expect(result.NODE_ENV).toBe("development");
    expect(result.PORT).toBe(3333);
    expect(result.BETTER_AUTH_URL).toBe("http://localhost:3333");
  });

  it("rejeita BETTER_AUTH_SECRET curto", () => {
    const result = envSchema.safeParse({
      DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
      BETTER_AUTH_SECRET: "curto",
    });

    expect(result.success).toBe(false);
  });

  it("converte PORT de string para número", () => {
    const result = envSchema.parse({
      DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
      BETTER_AUTH_SECRET: "segredo-suficientemente-longo-123",
      PORT: "4000",
    });

    expect(result.PORT).toBe(4000);
  });
});
