/**
 * mafia answers mallPrice from prices it read earlier in the same rollover day, even
 * across restarts, so the pearl has to be re-searched before the model values it.
 */
import { describe, expect, it } from "vitest";

import type { PearlSpec } from "../src/zones";

import { Game, Tools, loadGame, standardScenario } from "./support/harness";

function spec(g: Game, key: string): PearlSpec {
  const found = g.zones.PEARLS.find((p) => p.key === key);
  if (!found) throw new Error(`no ${key} spec`);
  return found;
}

/** A 70k reading from this morning, while the mall now sells at 80k. */
function staleMorningPrice(t: Tools): void {
  // VOA 6,500 and 10 Fishy fights: 65,000 of turns against the pearl's sale value.
  standardScenario(t, { res: 18, voa: 6500, fishyTurns: 10, pearlValue: 63_000 });
  const pearl = t.item("unblemished pearl", { mall: 70_000 });
  t.state.mallPriceAges.set(pearl, 0.18);
}

function mallMovedTo80k(t: Tools): void {
  t.state.mallSearchHandlers.set(t.item("unblemished pearl"), () => {
    t.item("unblemished pearl", { mall: 80_000, sale: 72_000 });
  });
}

function pearlSearches(g: Game): number {
  const pearl = g.item("unblemished pearl");
  return g.state.log.mallSearches.filter((i) => i === pearl).length;
}

describe("the pearl's value", () => {
  it("is SKIP on the cached morning price", async () => {
    const g = await loadGame(staleMorningPrice);
    const v = g.economics.zoneVerdict(spec(g, "cold"));
    expect(v.turns).toBe(10);
    expect(v.profit).toBe(63_000 - 65_000);
    expect(v.go).toBe(false);
  });

  it("comes from a live mall search, which flips the zone to GO", async () => {
    const g = await loadGame((t) => {
      staleMorningPrice(t);
      mallMovedTo80k(t);
    });
    expect(g.economics.pearlValue()).toBe(72_000);
    const v = g.economics.zoneVerdict(spec(g, "cold"));
    expect(v.profit).toBe(72_000 - 65_000);
    expect(v.go).toBe(true);
  });

  it("is searched once per run, however many zones are priced", async () => {
    const g = await loadGame((t) => {
      staleMorningPrice(t);
      mallMovedTo80k(t);
    });
    g.economics.primeZoneVerdicts(g.zones.PEARLS);
    g.economics.primeZoneVerdicts(g.zones.PEARLS);
    g.economics.pearlValue();
    expect(pearlSearches(g)).toBe(1);
  });
});
