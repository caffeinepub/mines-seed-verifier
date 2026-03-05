# Mines Seed Verifier

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- A provably fair mines verifier tool (similar to Stake.com mines verification)
- Input fields: Server Seed, Client Seed, Nonce
- Mines quantity selector: 1 to 24
- A 5x5 grid (25 tiles) that reveals mine positions based on the seeds
- The mine positions are computed deterministically using HMAC-SHA256 (server seed + client seed + nonce), exactly replicating Stake's mines algorithm
- Visual display: safe tiles and mine tiles clearly differentiated on the grid
- Copy-to-clipboard for seeds
- Reset/clear button

### Modify
Nothing (new project).

### Remove
Nothing (new project).

## Implementation Plan

### Backend (Motoko)
- Expose a `verifyMines` query function that accepts: serverSeed (Text), clientSeed (Text), nonce (Nat), minesCount (Nat) and returns an array of mine positions (0-24)
- Implement HMAC-SHA256 based provably fair algorithm:
  - Combine: HMAC-SHA256(serverSeed, clientSeed + ":" + nonce)
  - Use the resulting bytes to shuffle a 0-24 array (Fisher-Yates with derived floats)
  - Return first `minesCount` indices as mine positions

### Frontend (React)
- Header with app title and description
- Form with:
  - Server Seed input (text)
  - Client Seed input (text)
  - Nonce input (number)
  - Mines count selector (1-24)
  - Verify button
- 5x5 grid display:
  - Safe tiles: gem/diamond icon
  - Mine tiles: bomb/explosion icon
  - Animate reveal on verify
- Result summary: "X mines found at positions: ..."
- Reset button to clear all
