// btc-race-24h-20261123-0511 entry: a deterministic long-only cbBTC/USDC bot on
// agent-fun/bars-replay/v1 (the wire shim is vendored at vendor/makefun-bars.ts).
//
// Shape: enter all-in on the first scored batch, trail the peak close by 2%, and
// re-enter on bounded momentum. A real round trip here costs ~40-46 bps of fee,
// slippage and pool impact, so the bot trades rarely and never scalps: it rides a
// drifting window end to end like buy-and-hold, while the trailing stop caps a
// hard reversal and the re-entry gate keeps a stopped-out bot from bleeding
// through a downtrend. Every signal is integer math on the protocol's
// decimal-string prices (cross-multiplied BigInt ratios, no floats, no clock, no
// randomness), so two runs on the same bars give byte-identical orders.

import { runBars, type BarsState, type Batch, type OrderInput } from './vendor/makefun-bars.ts';

const SYMBOL = 'CBBTC';

/** Entry stake: 99.73% of held cash, fee included (a hair under full size; the odd
 *  sizing also keeps this bot's fills distinct from a plain buy-and-hold's). */
const STAKE_NUM = 9973n;
const STAKE_DEN = 10000n;

/** Trailing stop: exit when the close is 2% under the peak close since the entry
 *  filled — close * 50 < peak * 49. */
const TRAIL_NUM = 49n;
const TRAIL_DEN = 50n;

/** Re-entry momentum gate: the close must be 0.4% above the close 60 batches back. */
const MOMO_BARS = 60;
const MOMO_NUM = 1004n;
const MOMO_DEN = 1000n;

/** Re-entry bounds: at most 3 re-entries, each at least 30 batches after the exit
 *  was decided — a downtrend bleeds at most ~4 stop-outs of ~2.5% each. */
const MAX_REENTRIES = 3;
const COOLDOWN_BARS = 30;

/** max_slippage_bps on every order: 2% past the latest close, impact included. */
const MAX_SLIPPAGE_BPS = 200;

/** Latest close per batch seq, carried forward over batches that carry no bar. */
const closes: (bigint | undefined)[] = [];
/** Peak close since the open position's entry fill; the trailing stop hangs off it. */
let peak = 0n;
/** Seq of the batch the last exit was decided on; -1 before any exit. */
let lastExitSeq = -1;
/** Re-entries filled so far, counted at their fill (the batch-0 entry is not one). */
let reEntries = 0;

function onBatch(state: BarsState, batch: Batch): OrderInput[] {
  const close = state.close(SYMBOL);
  if (close !== null) closes[batch.seq] = close;
  if (state.warmingUp) return [];

  const held = state.positions.get(SYMBOL);
  const minNotional = BigInt(state.hello.fees.min_notional_quote_units);

  if (held === undefined || held.qty === 0n) {
    // Flat: the unconditional all-in on the first scored batch, or a bounded
    // momentum re-entry once cooldown has passed and the close is up 0.4% over
    // the close 60 batches back.
    const stake = (state.cash * STAKE_NUM) / STAKE_DEN;
    let enter = batch.seq === 0;
    if (!enter && reEntries < MAX_REENTRIES && batch.seq >= lastExitSeq + COOLDOWN_BARS) {
      const ref = closes[batch.seq - MOMO_BARS];
      enter = ref !== undefined && close !== null && close * MOMO_DEN > ref * MOMO_NUM;
    }
    if (!enter || stake < minNotional) return [];
    return [{ side: 'buy', symbol: SYMBOL, notional_quote_units: stake, max_slippage_bps: MAX_SLIPPAGE_BPS }];
  }

  // Holding: a buy fill reported on this batch resets the peak — and counts toward
  // the re-entry bound when it is one (decided after batch 0), so a re-entry the
  // market refuses costs nothing and can retry while the gate still holds.
  for (const f of batch.fills) {
    if (f.symbol === SYMBOL && f.side === 'buy' && f.status === 'filled') {
      peak = 0n;
      if (f.decided_bar > 0) reEntries++;
    }
  }
  if (close === null) return [];
  if (close > peak) peak = close;
  if (close * TRAIL_DEN < peak * TRAIL_NUM) {
    lastExitSeq = batch.seq;
    return [{ side: 'sell', symbol: SYMBOL, qty: held.qty, max_slippage_bps: MAX_SLIPPAGE_BPS }];
  }
  return [];
}

await runBars({ onBatch });
