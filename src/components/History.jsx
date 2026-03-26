import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { formatEth, shortAddress } from "../utils/helpers";
import { AuctionState, DisputeResult } from "../utils/contract";

export default function History({ contract, account }) {
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("all"); // all | mine

  useEffect(() => {
    loadHistory();
  }, [contract, account]);

  async function loadHistory() {
    if (!contract) return;
    try {
      setLoading(true);

      // Query all relevant event types from block 0 to latest
      const [
        committed,
        bidsPlaced,
        matched,
        revealed,
        released,
        stakeReturned,
        disputed,
        resolved,
      ] = await Promise.all([
        contract.queryFilter(contract.filters.ProfileCommitted(),  0, "latest"),
        contract.queryFilter(contract.filters.BidPlaced(),         0, "latest"),
        contract.queryFilter(contract.filters.AuctionMatched(),    0, "latest"),
        contract.queryFilter(contract.filters.IdentityRevealed(),  0, "latest"),
        contract.queryFilter(contract.filters.PaymentReleased(),   0, "latest"),
        contract.queryFilter(contract.filters.StakeReturned(),     0, "latest"),
        contract.queryFilter(contract.filters.DisputeRaised(),     0, "latest"),
        contract.queryFilter(contract.filters.DisputeResolved(),   0, "latest"),
      ]);

      const raw = [
        ...committed.map(e => ({
          type:      "profile_committed",
          label:     "Profile posted",
          icon:      "◎",
          color:     "purple",
          block:     e.blockNumber,
          txHash:    e.transactionHash,
          profileId: Number(e.args.profileId),
          address:   e.args.freelancer,
          detail:    `Skills: ${e.args.skills} · Stake: ${formatEth(e.args.stake)}`,
        })),
        ...bidsPlaced.map(e => ({
          type:      "bid_placed",
          label:     "Bid placed",
          icon:      "◈",
          color:     "blue",
          block:     e.blockNumber,
          txHash:    e.transactionHash,
          auctionId: Number(e.args.auctionId),
          address:   e.args.employer,
          detail:    `Auction #${e.args.auctionId} · ${formatEth(e.args.amount)}`,
        })),
        ...matched.map(e => ({
          type:      "matched",
          label:     "Bid accepted",
          icon:      "✓",
          color:     "green",
          block:     e.blockNumber,
          txHash:    e.transactionHash,
          auctionId: Number(e.args.auctionId),
          address:   e.args.employer,
          detail:    `Auction #${e.args.auctionId} · Employer: ${shortAddress(e.args.employer)}`,
        })),
        ...revealed.map(e => ({
          type:      "revealed",
          label:     "Identity revealed",
          icon:      "◇",
          color:     "teal",
          block:     e.blockNumber,
          txHash:    e.transactionHash,
          profileId: Number(e.args.profileId),
          address:   e.args.freelancer,
          detail:    `Profile #${e.args.profileId} · Name: ${e.args.name}`,
        })),
        ...released.map(e => ({
          type:      "payment_released",
          label:     "Payment released",
          icon:      "⬡",
          color:     "green",
          block:     e.blockNumber,
          txHash:    e.transactionHash,
          auctionId: Number(e.args.auctionId),
          address:   e.args.freelancer,
          detail:    `Auction #${e.args.auctionId} · ${formatEth(e.args.amount)} paid`,
        })),
        ...stakeReturned.map(e => ({
          type:      "stake_returned",
          label:     "Stake returned",
          icon:      "◉",
          color:     "teal",
          block:     e.blockNumber,
          txHash:    e.transactionHash,
          profileId: Number(e.args.profileId),
          address:   e.args.freelancer,
          detail:    `Profile #${e.args.profileId} · ${formatEth(e.args.amount)} unlocked`,
        })),
        ...disputed.map(e => ({
          type:      "dispute_raised",
          label:     "Dispute raised",
          icon:      "⚠",
          color:     "amber",
          block:     e.blockNumber,
          txHash:    e.transactionHash,
          auctionId: Number(e.args.auctionId),
          address:   e.args.raisedBy,
          detail:    `Auction #${e.args.auctionId} · "${e.args.reason}"`,
        })),
        ...resolved.map(e => ({
          type:      "dispute_resolved",
          label:     "Dispute resolved",
          icon:      "⬡",
          color:     Number(e.args.result) === 2 ? "red" : "green",
          block:     e.blockNumber,
          txHash:    e.transactionHash,
          auctionId: Number(e.args.auctionId),
          address:   e.args.penalised,
          detail:    `Auction #${e.args.auctionId} · ${DisputeResult[Number(e.args.result)]} · Penalised: ${shortAddress(e.args.penalised)}`,
        })),
      ];

      // Sort newest first
      raw.sort((a, b) => b.block - a.block);
      setEvents(raw);
    } catch (e) {
      console.error("History load error:", e);
    } finally {
      setLoading(false);
    }
  }

  const filtered = filter === "mine"
    ? events.filter(e => e.address?.toLowerCase() === account?.toLowerCase())
    : events;

  function openTx(hash) {
    window.open(`https://sepolia.etherscan.io/tx/${hash}`, "_blank");
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Transaction History</h2>
          <p className="panel-sub" style={{ marginBottom: 0 }}>
            Every action is permanently recorded on Sepolia. Click any row to view on Etherscan.
          </p>
        </div>
        <button className="btn-ghost-sm" onClick={loadHistory}>↺ Refresh</button>
      </div>

      <div className="history-filters">
        <button className={filter === "all"  ? "filter-active" : "filter-btn"} onClick={() => setFilter("all")}>All activity</button>
        <button className={filter === "mine" ? "filter-active" : "filter-btn"} onClick={() => setFilter("mine")}>My activity</button>
      </div>

      {loading && <div className="loading-state">Reading events from chain…</div>}

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">◎</div>
          <h3>No activity yet</h3>
          <p>Transactions will appear here as the contract is used.</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="history-list">
          {filtered.map((e, i) => (
            <div key={i} className="history-row" onClick={() => openTx(e.txHash)}>
              <div className={`history-icon hc-${e.color}`}>{e.icon}</div>
              <div className="history-body">
                <div className="history-label">{e.label}</div>
                <div className="history-detail">{e.detail}</div>
              </div>
              <div className="history-right">
                <div className="history-block">Block {e.block}</div>
                <div className="history-link">↗ Etherscan</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
