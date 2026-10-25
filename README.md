# nox-frontend

Public proof dashboard for [Nox](https://github.com/Nox-QIE): anyone can check that a Werewolf game was played fair, straight from the QIE blockchain, in their own browser.

- **Game proof page** (`/game/?id=0x…`): reads every `NoxGame` event for the game plus the decoded `revealAndFinalize` calldata, then recomputes in the browser, with `@nox/shared/crypto-spec`:
  1. the role root was on-chain before the first action,
  2. every revealed role is in the committed Merkle root,
  3. every player who joined had their role revealed,
  4. every sealed night action opens to the revealed action,
  5. replaying the night actions and votes with the open-source rules (`@nox/shared/engine`) gives the recorded winner.
- **Check my role**: paste the code the bot sent by DM to confirm the role you were dealt is the role that was revealed.
- **Home**: recent games and a leaderboard from `CreditsMinted` events.
- **Metrics** (`/metrics`): unique player wallets, transactions signed by players, verified games, credits, and players signing per day (30 days), counted from chain events in the browser.
- Indonesian and English. Mobile first. Static export: no server, the browser talks to the QIE RPC directly (it allows CORS). Logs are read in 10,000-block windows (the QIE RPC limit).

## Run

```bash
cp .env.example .env.local   # set chain id, RPC, contract addresses, deploy block
npm install
npm run dev                  # http://localhost:3000
npm run build                # static site in out/
```

For a local chain with demo games, run `npm run dev:chain` in [nox-backend](https://github.com/Nox-QIE/nox-backend) and use the env it prints.

## Test

`npm test` verifies both demo games against the dev chain and checks that tampering with a role, a salt, a night target or a vote is caught (skipped when the dev chain is not running).

After the contracts change: `(cd ../nox-contracts && forge build) && npm run sync-abi`.
