# SkillVault

> Privacy-first hiring on Ethereum.  
> Skills stay visible. Identity stays protected until the match is locked.

<p align="center">
  <img src="./public/favicon.svg" alt="SkillVault logo" width="72" />
</p>

<p align="center">
  <strong>Blind talent auctions • Commit-reveal identity • On-chain escrow • Verified reputation</strong>
</p>

---

## What It Is

SkillVault is a decentralized hiring marketplace where employers bid on ability instead of background.

Freelancers post a blind profile with:

- public skills
- a minimum bid
- a locked reputation stake

Their personal identity stays hidden until a bid is accepted. Once matched, the freelancer reveals the exact identity data that was committed earlier, and the contract handles settlement on-chain.

---

## Core Idea

Traditional hiring platforms expose the person first and the proof second.

SkillVault flips that model:

| Traditional flow | SkillVault flow |
| --- | --- |
| Name, photo, school, profile first | Skills, stake, endorsements first |
| Reputation is mostly platform-owned | Reputation is on-chain and portable |
| Payment and trust happen off-platform | Escrow, release, disputes, and stake return happen on-chain |

---

## Workflow

### 1. Commit Identity

The freelancer hashes:

`name + salt + email`

Only the commitment is stored on-chain. Personal details remain private.

### 2. Open Auction

The profile goes live with:

- visible skills
- minimum acceptable bid
- locked reputation stake

### 3. Bid on Skill

Employers browse blind profiles and bid without seeing identity details.

### 4. Accept and Reveal

The freelancer accepts the strongest offer, then reveals the exact identity data used in the original commitment.

### 5. Settle On-Chain

Payment is released through the contract. A dispute window and stake return flow complete the trust loop.

---

## Current Features

### Landing + Dashboard

- polished dark UI matching the privacy-first product theme
- dedicated overview page instead of repeating summary content everywhere
- responsive dashboard with focused workflow tabs

### Blind Profile Flow

- local commit-hash generation
- salt generation
- skill selection and custom skills
- minimum bid and required stake calculation
- review step before committing on-chain

### Auction Marketplace

- browse open auctions
- place bids with role/project description
- sort by:
  - ending soon
  - highest reputation
  - lowest minimum bid
  - highest minimum bid
  - most endorsed
  - most bids
  - newest
- filter by:
  - skill search
  - freelancer reputation
  - endorsed profiles only

### Reputation + Trust

- employer skill endorsements
- visible reputation score
- endorsement counts per skill
- stake-backed trust model

### Settlement

- accept bids
- reveal identity
- release payment
- raise disputes
- reclaim stake
- renew expired auctions

### Notifications

- browser notifications for important on-chain events
- transaction toasts inside the app

---

## Tech Stack

| Layer | Stack |
| --- | --- |
| Frontend | React 19 + Vite |
| Blockchain client | ethers.js |
| Smart contract | Solidity |
| Wallet connection | MetaMask / `window.ethereum` |
| Styling | Custom CSS design system |

---

## Project Structure

```text
src/
  components/       UI flows: bidding, commit, settlement, endorsements
  hooks/            on-chain browser notifications
  pages/            landing page + dashboard
  utils/            contract ABI, helpers, formatting
public/             static assets
BlindSkillAuction(1).sol
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the app

```bash
npm run dev
```

### 3. Build for production

```bash
npm run build
```

### 4. Preview the production build

```bash
npm run preview
```

---

## Important Notes

- This app currently uses browser notifications, not email notifications.
- MetaMask is required for wallet connection.
- The frontend expects a deployed compatible SkillVault contract and ABI.
- The identity email is part of the commit-reveal verification flow, not a messaging system.

---

## Why This Project Matters

SkillVault is not just a UI demo. It explores a practical question:

**Can we design a hiring system where trust comes from verifiable work and transparent settlement instead of identity-first bias?**

That makes it useful as:

- a final year project
- a Web3 product prototype
- a trust and reputation experiment
- a privacy-first hiring concept

---

## Next Utility-Focused Improvements

- employer-side `My Bids` tracking
- stronger auction analytics and bid comparison
- dispute evidence attachments
- auto-refresh for live marketplace updates
- deeper reputation breakdown instead of a single score

---

## License

Add your preferred license here.
