import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { formatEth, timeLeft, shortAddress } from "../utils/helpers";
import { AuctionState } from "../utils/contract";

const SORT_OPTIONS = [
  { value: "endingSoon", label: "Ending soon" },
  { value: "highestRep", label: "Highest reputation" },
  { value: "lowestBid", label: "Lowest minimum bid" },
  { value: "highestBid", label: "Highest minimum bid" },
  { value: "mostEndorsed", label: "Most endorsed" },
  { value: "mostBids", label: "Most bids" },
  { value: "newest", label: "Newest auction" },
];

const REP_FILTERS = [
  { value: "all", label: "All reps" },
  { value: "positive", label: "Positive rep" },
  { value: "5", label: "Rep 5+" },
  { value: "10", label: "Rep 10+" },
  { value: "20", label: "Rep 20+" },
];

function matchesRepFilter(reputation, filter) {
  if (filter === "all") return true;
  if (filter === "positive") return reputation > 0;
  return reputation >= Number(filter);
}

function sortAuctions(items, sortBy) {
  const sorted = [...items];

  sorted.sort((a, b) => {
    if (sortBy === "highestRep") return b.reputation - a.reputation;
    if (sortBy === "lowestBid") return a.minBidEth - b.minBidEth;
    if (sortBy === "highestBid") return b.minBidEth - a.minBidEth;
    if (sortBy === "mostEndorsed") return b.endorsementCount - a.endorsementCount;
    if (sortBy === "mostBids") return b.bidCount - a.bidCount;
    if (sortBy === "newest") return b.auctionId - a.auctionId;
    return Number(a.deadline) - Number(b.deadline);
  });

  return sorted;
}

export default function BrowseAuctions({ contract, account, notify }) {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidAmounts, setBidAmounts] = useState({});
  const [bidDesc, setBidDesc] = useState({});
  const [placing, setPlacing] = useState(null);
  const [skillQuery, setSkillQuery] = useState("");
  const [repFilter, setRepFilter] = useState("all");
  const [sortBy, setSortBy] = useState("endingSoon");
  const [endorsedOnly, setEndorsedOnly] = useState(false);

  useEffect(() => {
    loadAuctions();
  }, [contract]);

  async function loadAuctions() {
    if (!contract) return;

    try {
      setLoading(true);
      const count = await contract.auctionCount();
      const items = [];

      for (let i = 1; i <= Number(count); i++) {
        const auction = await contract.auctions(i);
        const profile = await contract.profiles(auction[0]);

        if (Number(auction[1]) !== 0 || profile[4].toLowerCase() === account.toLowerCase()) {
          continue;
        }

        let endorsements = {};
        let endorsementCount = 0;
        let reputation = 0;

        try {
          const [[skills, counts], rep] = await Promise.all([
            contract.getEndorsements(profile[4]),
            contract.getReputation(profile[4]),
          ]);

          skills.forEach((skill, idx) => {
            const countForSkill = Number(counts[idx]);
            endorsements[skill] = countForSkill;
            endorsementCount += countForSkill;
          });

          reputation = Number(rep);
        } catch {}

        items.push({
          auctionId: i,
          profileId: Number(auction[0]),
          state: AuctionState[Number(auction[1])],
          deadline: auction[2],
          bidCount: Number(auction[4]),
          skills: profile[1],
          skillsList: profile[1].split(",").map((skill) => skill.trim()).filter(Boolean),
          minBid: profile[2],
          minBidEth: Number(ethers.formatEther(profile[2])),
          stakeWei: profile[3],
          freelancer: profile[4],
          endorsements,
          endorsementCount,
          reputation,
        });
      }

      setAuctions(items);
    } catch (error) {
      notify("Failed to load auctions: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function placeBid(auctionId) {
    const amount = bidAmounts[auctionId];
    const desc = bidDesc[auctionId];

    if (!amount || !desc) {
      notify("Enter bid amount and job description", "error");
      return;
    }

    try {
      setPlacing(auctionId);
      notify("Submitting bid…", "pending");
      const tx = await contract.placeBid(auctionId, desc, {
        value: ethers.parseEther(amount),
      });
      await tx.wait();
      notify("Bid placed successfully!", "success");
      loadAuctions();
    } catch (error) {
      notify(error.reason || error.message || "Bid failed", "error");
    } finally {
      setPlacing(null);
    }
  }

  function resetFilters() {
    setSkillQuery("");
    setRepFilter("all");
    setSortBy("endingSoon");
    setEndorsedOnly(false);
  }

  const filteredAuctions = sortAuctions(
    auctions.filter((auction) => {
      const normalizedQuery = skillQuery.trim().toLowerCase();
      const matchesSkill =
        !normalizedQuery ||
        auction.skillsList.some((skill) => skill.toLowerCase().includes(normalizedQuery));
      const matchesRep = matchesRepFilter(auction.reputation, repFilter);
      const matchesEndorsed = !endorsedOnly || auction.endorsementCount > 0;
      return matchesSkill && matchesRep && matchesEndorsed;
    }),
    sortBy
  );

  if (loading) {
    return <div className="loading-state">Loading auctions from chain…</div>;
  }

  if (auctions.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">◎</div>
        <h3>No open auctions right now</h3>
        <p>Freelancers haven't posted profiles yet, or all auctions have closed.</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">Open Auctions</h2>
        <button className="btn-ghost-sm" onClick={loadAuctions}>↺ Refresh</button>
      </div>
      <p className="panel-sub">
        Zero identity information is shown. Filter by skill, reputation, and verified endorsements
        to find the strongest matches faster.
      </p>

      <div className="browse-toolbar">
        <div className="browse-filter-group browse-filter-search">
          <label htmlFor="skill-query">Search skill</label>
          <input
            id="skill-query"
            value={skillQuery}
            onChange={(event) => setSkillQuery(event.target.value)}
            placeholder="Solidity, React, DeFi..."
          />
        </div>

        <div className="browse-filter-group">
          <label htmlFor="rep-filter">Reputation</label>
          <select
            id="rep-filter"
            value={repFilter}
            onChange={(event) => setRepFilter(event.target.value)}
          >
            {REP_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="browse-filter-group">
          <label htmlFor="sort-by">Sort by</label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <label className="toggle-check">
          <input
            type="checkbox"
            checked={endorsedOnly}
            onChange={(event) => setEndorsedOnly(event.target.checked)}
          />
          <span>Endorsed only</span>
        </label>

        <button className="btn-ghost-sm" type="button" onClick={resetFilters}>
          Clear
        </button>
      </div>

      <div className="browse-summary">
        <span>{filteredAuctions.length} match{filteredAuctions.length === 1 ? "" : "es"}</span>
        <span className="divider">·</span>
        <span>Sorted by {SORT_OPTIONS.find((option) => option.value === sortBy)?.label.toLowerCase()}</span>
      </div>

      {filteredAuctions.length === 0 ? (
        <div className="empty-state empty-state-inline">
          <div className="empty-icon">◌</div>
          <h3>No auctions match these filters</h3>
          <p>Try widening the skill search or lowering the reputation requirement.</p>
        </div>
      ) : (
        <div className="auction-grid">
          {filteredAuctions.map((auction) => (
            <div key={auction.auctionId} className="auction-card">
              <div className="auction-top">
                <div className="auction-id">Auction #{auction.auctionId}</div>
                <div className="auction-timer">{timeLeft(auction.deadline)}</div>
              </div>

              <div className="auction-signal-row">
                <span className={`signal-pill ${auction.reputation > 0 ? "signal-good" : auction.reputation < 0 ? "signal-risk" : ""}`}>
                  Rep {auction.reputation > 0 ? `+${auction.reputation}` : auction.reputation}
                </span>
                <span className={`signal-pill ${auction.endorsementCount > 0 ? "signal-good" : ""}`}>
                  {auction.endorsementCount} endorsement{auction.endorsementCount === 1 ? "" : "s"}
                </span>
              </div>

              <div className="skill-tags">
                {auction.skillsList.map((skill) => {
                  const count = auction.endorsements?.[skill] || 0;
                  return (
                    <span
                      key={skill}
                      className={`skill-tag-display ${count > 0 ? "skill-tag-endorsed" : ""}`}
                      title={
                        count > 0
                          ? `Endorsed by ${count} previous employer${count > 1 ? "s" : ""}`
                          : "Claimed skill"
                      }
                    >
                      {skill}
                      {count > 0 && <span className="endorse-count">×{count}</span>}
                    </span>
                  );
                })}
              </div>

              <div className="stake-badge">◉ Stake locked: {formatEth(auction.stakeWei)}</div>

              <div className="auction-meta">
                <div className="meta-item">
                  <span className="meta-label">Minimum bid</span>
                  <span className="meta-value accent">{formatEth(auction.minBid)}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Bids placed</span>
                  <span className="meta-value">{auction.bidCount}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Freelancer</span>
                  <span className="meta-value dim">{shortAddress(auction.freelancer)}</span>
                </div>
              </div>

              <div className="bid-form">
                <input
                  type="number"
                  step="0.001"
                  placeholder={`Min: ${ethers.formatEther(auction.minBid)} ETH`}
                  value={bidAmounts[auction.auctionId] || ""}
                  onChange={(event) =>
                    setBidAmounts((current) => ({
                      ...current,
                      [auction.auctionId]: event.target.value,
                    }))
                  }
                />
                <textarea
                  rows={2}
                  placeholder="Describe the role / project…"
                  value={bidDesc[auction.auctionId] || ""}
                  onChange={(event) =>
                    setBidDesc((current) => ({
                      ...current,
                      [auction.auctionId]: event.target.value,
                    }))
                  }
                />
                <button
                  className="btn-primary"
                  onClick={() => placeBid(auction.auctionId)}
                  disabled={placing === auction.auctionId}
                >
                  {placing === auction.auctionId ? "Placing bid…" : "Place Bid →"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
