import { afterEach, describe, expect, it, vi } from "vitest";
import {
  canAddToCalendar,
  emptySource,
  findConfirmation,
  getConfirmationSource,
  isWellFormedToken,
  publicBaseUrl,
  sampleSource,
} from "./confirmation";
import { sampleConfirmations } from "./samples";

const slug = "creating-engaging-digital-content";

describe("finding a registration by its secure token", () => {
  it("finds a known token for its own event", async () => {
    expect((await findConfirmation("sample-confirmed", slug, sampleSource))?.status).toBe("confirmed");
  });

  it("refuses a token for another event's page", async () => {
    expect(await findConfirmation("sample-confirmed", "another-event", sampleSource)).toBeNull();
  });

  it("refuses malformed tokens before any lookup", async () => {
    const source = { findByToken: vi.fn(sampleSource.findByToken) };
    for (const token of [undefined, "", "short", "has spaces in it!!", ["sample-confirmed"], "x".repeat(129)]) {
      expect(await findConfirmation(token, slug, source)).toBeNull();
    }
    expect(source.findByToken).not.toHaveBeenCalled();
  });

  it("accepts URL-safe tokens of a sensible length", () => {
    expect(isWellFormedToken("sample-confirmed")).toBe(true);
    expect(isWellFormedToken("A1_b2-C3d4E5f6G7h8")).toBe(true);
    expect(isWellFormedToken("../../etc/passwd")).toBe(false);
  });

  it("finds nothing for an unknown token", async () => {
    expect(await findConfirmation("unknown-token-1234", slug, sampleSource)).toBeNull();
  });
});

describe("which source is used", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("uses the samples only when PUBLIC_SAMPLE_DATA is on (localhost)", () => {
    vi.stubEnv("APP_BASE_URL", "http://localhost:3000");
    vi.stubEnv("PUBLIC_SAMPLE_DATA", "true");
    expect(getConfirmationSource()).toBe(sampleSource);
  });

  it("finds nothing when the samples are off (staging and production until T022)", async () => {
    vi.stubEnv("APP_BASE_URL", "http://localhost:3000");
    vi.stubEnv("PUBLIC_SAMPLE_DATA", "");
    expect(getConfirmationSource()).toBe(emptySource);
    expect(await findConfirmation("sample-confirmed", slug)).toBeNull();
  });
});

describe("helpers", () => {
  it("only confirmed or submitted places go into a calendar", () => {
    expect(canAddToCalendar(sampleConfirmations["sample-confirmed"]!)).toBe(true);
    expect(canAddToCalendar({ ...sampleConfirmations["sample-confirmed"]!, status: "submitted" })).toBe(true);
    expect(canAddToCalendar(sampleConfirmations["sample-waitlisted"]!)).toBe(false);
    expect(canAddToCalendar(sampleConfirmations["sample-cancelled"]!)).toBe(false);
  });

  it("reads the public address from APP_BASE_URL", () => {
    expect(publicBaseUrl({ APP_BASE_URL: "https://events.pmaa.example/some/path" })).toBe("https://events.pmaa.example");
    expect(publicBaseUrl({})).toBe("http://localhost:3000");
  });
});
