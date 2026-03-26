import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { formatEth, shortAddress, timeLeft } from "../utils/helpers";
import { AuctionState } from "../utils/contract";

export default function MyProfiles({ contract, account, notify }) {
  const [profiles, setProfiles]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [accepting, setAccepting]   = useState(null);
  const [expiring, setExpiring]     = useState(null);
  const [renewing, setRenewing]     = useState(null);

  useEffect(() => { loadMyProfiles(); }, [contract, account]);

  async function loadMyProfiles() {
    if (!contract || !account) return;
    try {
      setLoading(true);
      const profileIds = await contract.getFreelancerProfiles(account);
      const items = [];
      const aCount = await contract.auctionCount();

      for (const pid of profileIds) {
        const profile = await contract.profiles(pid);

        // v4 profile struct:
        // [0] commitHash [1] skills [2] minBidWei [3] stakeWei
        // [4] freelancer [5] exists [6] revealed  [7] revealedName

        let auctionData = null;
        for (let i = 1; i <= Number(aCount); i++) {
          const a = await contract.auctions(i);
          if (Number(a[0]) === Number(pid)) {
            const bids = [];
            for (let b = 1; b <= Number(a[4]); b++) {
              const bid = await contract.getBid(i, b);
              if (!bid[3]) {
                bids.push({
                  bidId: b, employer: bid[0], amount: bid[1],
                  jobDescription: bid[2], withdrawn: bid[3], matched: bid[4],
                });
              }
            }
            bids.sort((a, b) => (b.amount > a.amount ? 1 : -1));

            // Check if expired but not yet marked on-chain
            const stateNum    = Number(a[1]);
            const deadline    = Number(a[2]);
            const isOverdue   = stateNum === 0 && Date.now() / 1000 >= deadline;
            const renewCount  = Number(a[6]); // auctions now return renewCount at index 6
            const canRenew    = stateNum === 5 && Number(a[4]) === 0 && renewCount < 3;

            auctionData = {
              auctionId:    i,
              state:        isOverdue ? "Expired" : AuctionState[stateNum],
              stateNum,
              bids,
              highestBidId: Number(a[3]),
              deadline,
              isOverdue,
              canRenew,
              renewCount,
            };
            break;
          }
        }

        items.push({
          profileId: Number(pid),
          skills:    profile[1],
          minBid:    profile[2],
          stakeWei:  profile[3],
          revealed:  profile[6],
          auction:   auctionData,
        });
      }
      setProfiles(items);
    } catch (e) {
      notify("Failed to load profiles: " + e.message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function acceptBid(auctionId, bidId) {
    try {
      setAccepting(`${auctionId}-${bidId}`);
      notify("Accepting bid on-chain…", "pending");
      const tx = await contract.acceptBid(auctionId, bidId);
      await tx.wait();
      notify("Bid accepted! Go to Settle → Reveal Identity.", "success");
      loadMyProfiles();
    } catch (e) {
      notify(e.reason || e.message || "Failed", "error");
    } finally {
      setAccepting(null);
    }
  }

  async function expireAuction(auctionId) {
    try {
      setExpiring(auctionId);
      notify("Marking auction as expired…", "pending");
      const tx = await contract.expireAuction(auctionId);
      await tx.wait();
      notify("Auction expired. Stake returned. You can renew if no bids came in.", "success");
      loadMyProfiles();
    } catch (e) {
      notify(e.reason || e.message || "Failed", "error");
    } finally {
      setExpiring(null);
    }
  }

  async function renewAuction(auctionId, minBidWei) {
    try {
      setRenewing(auctionId);
      notify("Renewing auction…", "pending");
      const stakeWei = await contract.requiredStake(minBidWei);
      const tx = await contract.renewAuction(auctionId, { value: stakeWei });
      await tx.wait();
      notify("Auction renewed for 7 more days!", "success");
      loadMyProfiles();
    } catch (e) {
      notify(e.reason || e.message || "Renewal failed", "error");
    } finally {
      setRenewing(null);
    }
  }

  if (loading) return <div className="loading-state">Loading your profiles…</div>;
  if (profiles.length === 0) return (
    <div className="empty-state">
      <div className="empty-icon">◉</div>
      <h3>No profiles yet</h3>
      <p>Head to Post Profile to commit your first blind profile.</p>
    </div>
  );

  return (
    <div className="panel">
      <h2 className="panel-title">My Work</h2>
      <p className="panel-sub">Accept bids, track auction status, and renew expired listings.</p>

      <div className="profile-list">
        {profiles.map((p) => (
          <div key={p.profileId} className="profile-item">
            <div className="profile-item-header">
              <span className="auction-id">Profile #{p.profileId}</span>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                {p.auction?.isOverdue && (
                  <button
                    className="btn-expire"
                    onClick={() => expireAuction(p.auction.auctionId)}
                    disabled={expiring === p.auction.auctionId}
                  >
                    {expiring === p.auction.auctionId ? "…" : "Mark Expired"}
                  </button>
                )}
                <span className={`state-badge state-${p.auction?.state?.toLowerCase()}`}>
                  {p.auction?.state || "—"}
                </span>
              </div>
            </div>

            <div className="skill-tags">
              {p.skills.split(",").map((s) => (
                <span key={s} className="skill-tag-display">{s.trim()}</span>
              ))}
            </div>

            <div className="auction-meta">
              <div className="meta-item">
                <span className="meta-label">Bid floor</span>
                <span className="meta-value accent">{formatEth(p.minBid)}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Stake locked</span>
                <span className="meta-value" style={{ color: "var(--teal)" }}>{formatEth(p.stakeWei)}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">
                  {p.auction?.state === "Open" ? "Time left" : "Bids"}
                </span>
                <span className="meta-value">
                  {p.auction?.state === "Open"
                    ? timeLeft(p.auction.deadline)
                    : (p.auction?.bids?.length ?? 0)}
                </span>
              </div>
            </div>

            {/* Renew button for expired auctions with no bids */}
            {p.auction?.state === "Expired" && p.auction?.canRenew && (
              <div className="renew-box">
                <p>No bids came in. Renew for another 7 days — stake will be re-locked.</p>
                <p style={{ fontSize: 11, color: "var(--dim)", margin: "4px 0 8px" }}>
                  Renewals used: {p.auction.renewCount}/3
                </p>
                <button
                  className="btn-primary"
                  onClick={() => renewAuction(p.auction.auctionId, p.minBid)}
                  disabled={renewing === p.auction.auctionId}
                >
                  {renewing === p.auction.auctionId ? "Renewing…" : `Renew — stake ${formatEth((BigInt(p.minBid) * 1000n) / 10000n)} ETH`}
                </button>
              </div>
            )}

            {p.auction?.state === "Expired" && !p.auction?.canRenew && p.auction?.renewCount >= 3 && (
              <div className="warn-box" style={{ marginTop: "0.75rem" }}>
                Maximum renewals (3) reached. This profile cannot be relisted.
              </div>
            )}

            {p.auction?.bids?.length > 0 && (
              <div className="bids-list">
                <h4 className="bids-label">Incoming Bids</h4>
                {p.auction.bids.map((b) => (
                  <div key={b.bidId} className={`bid-row ${b.matched ? "bid-matched" : ""}`}>
                    <div className="bid-left">
                      <span className="bid-employer">{shortAddress(b.employer)}</span>
                      <span className="bid-job">{b.jobDescription}</span>
                    </div>
                    <div className="bid-right">
                      <span className="bid-amount">{formatEth(b.amount)}</span>
                      {p.auction.state === "Open" && !b.matched && (
                        <button
                          className="btn-accept"
                          onClick={() => acceptBid(p.auction.auctionId, b.bidId)}
                          disabled={accepting === `${p.auction.auctionId}-${b.bidId}`}
                        >
                          Accept
                        </button>
                      )}
                      {b.matched && <span className="matched-tag">✓ Accepted</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {p.auction?.bids?.length === 0 && p.auction?.state === "Open" && (
              <div className="no-bids">No bids yet. Auction ID: #{p.auction?.auctionId}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
  