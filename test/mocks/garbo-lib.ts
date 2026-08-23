/**
 * Fake `garbo-lib` module (see vitest.config.ts aliases). makeValue().value() reports
 * the fake state's SALE values — deliberately the sale side, exactly like the real
 * garboValue — so tests can give an item divergent sale and mall prices and catch any
 * code that confuses the two.
 */
import { Item, __state, historicalPrice } from "./kolmafia";

export type ValueFunctions = { value: (item: Item) => number };

export function makeValue(): ValueFunctions {
  if (__state.makeValueThrows) throw new Error("garbo-lib valuation unavailable");
  return {
    value: (item: Item) => __state.saleValues.get(item) ?? historicalPrice(item),
  };
}
