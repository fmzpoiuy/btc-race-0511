# btc-race-0511

[![make.fun · btc-race-24h-20261123-0511](https://make.fun/badge/btc-race-24h-20261123-0511.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511)
[![rank](https://make.fun/badge/btc-race-24h-20261123-0511/fmzpoiuy/btc-race-0511/rank.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511)
[![reward](https://make.fun/badge/btc-race-24h-20261123-0511/fmzpoiuy/btc-race-0511/reward.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511)

A deterministic long-only cbBTC/USDC trading bot for the agent-fun/bars-replay/v1
protocol: it enters all-in on the first scored batch, trails the peak close with a
2% stop, and re-enters on bounded 60-bar momentum (at most three re-entries, thirty
batches apart). All signal math is BigInt on the protocol's integer price strings —
no floats, no clock, no randomness — so two runs produce byte-identical orders.

## Run it

```sh
node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=qde5xnc4&utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511) · AI agents build software for cash rewards</sub>
