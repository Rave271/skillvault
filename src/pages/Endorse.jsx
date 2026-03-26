import { useState, useEffect } from "react";
import { shortAddress } from "../utils/helpers";

export default function Endorse({ contract, account, notify }) {
  const [auctionId, setAuctionId]   = useState("");
  const [freelancer, setFreelancer] = useState(null);
  const [skills, setSkills]         = useState([]);
  const [selected, setSelected]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [endorsing, setEndorsing]   = useState(false);
  const [existing, setExisting]     = useState([]); // already endorsed skills

  async function loadAuction() {
    if (!auctionId || !contract) return;
    try {
      setLoading(true);
      setFreelancer(null);
      setSkills([]);
      setSelected([]);

      const auction  = await contract.auctions(auctionId);
      const state    = Number(auction[1]);

      // Must be Closed (3) or Disputed (4)
      if (state !== 3 && state !== 4) {
        notify("This auction is not closed yet. Payment must be released first.", "error");
        return;
      }

      const win = await contract.getBid(auctionId, Number(auction[3]));
      if (win[0].toLowerCase() !== account.toLowerCase()) {
        notify("Only the winning employer of this auction can endorse skills.", "error");
        return;
      }

      const profile       = await contract.profiles(auction[0]);
      const freelancerAddr = profile[4];
      const skillList     = profile[1].split(",").map(s => s.trim()).filter(Boolean);

      // Check which skills already endorsed
      const alreadyEndorsed = [];
      for (const skill of skillList) {
        const endorsed = await contract.hasEndorsed(account, freelancerAddr, skill);
        if (endorsed) alreadyEndorsed.push(skill);
      }

      setFreelancer(freelancerAddr);
      setSkills(skillList);
      setExisting(alreadyEndorsed);
    } catch (e) {
      notify("Failed to load auction: " + (e.reason || e.message), "error");
    } finally {
      setLoading(false);
    }
  }

  function toggleSkill(s) {
    if (existing.includes(s)) return; // already endorsed
    setSelected(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
  }

  async function handleEndorse() {
    if (selected.length === 0) { notify("Select at least one skill to endorse", "error"); return; }
    try {
      setEndorsing(true);
      for (const skill of selected) {
        notify(`Endorsing ${skill}…`, "pending");
        const tx = await contract.endorseSkill(auctionId, skill);
        await tx.wait();
      }
      notify(`${selected.length} skill${selected.length > 1 ? "s" : ""} endorsed on-chain!`, "success");
      setExisting(p => [...p, ...selected]);
      setSelected([]);
    } catch (e) {
      notify(e.reason || e.message || "Endorsement failed", "error");
    } finally {
      setEndorsing(false);
    }
  }

  return (
    <div className="panel">
      <h2 className="panel-title">Endorse Skills</h2>
      <p className="panel-sub">
        After a job closes, confirm which skills the freelancer actually demonstrated.
        Endorsements are stored permanently on-chain and shown on all future profiles.
        Only verified paying employers can endorse — it cannot be faked.
      </p>

      <div className="form-group">
        <label>Auction ID</label>
        <div className="custom-skill-row">
          <input
            type="number"
            value={auctionId}
            onChange={e => setAuctionId(e.target.value)}
            placeholder="e.g. 1"
          />
          <button className="btn-ghost-sm" onClick={loadAuction} disabled={loading}>
            {loading ? "…" : "Load →"}
          </button>
        </div>
      </div>

      {freelancer && (
        <>
          <div className="info-box" style={{ marginBottom: "1.5rem" }}>
            Freelancer wallet: <code style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--accent2)" }}>{shortAddress(freelancer)}</code>
            <br />Select the skills below that this person genuinely demonstrated during the project.
          </div>

          <div className="form-group">
            <label>Skills from this job</label>
            <div className="skill-grid">
              {skills.map(s => {
                const isEndorsed = existing.includes(s);
                const isSelected = selected.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    className={`skill-chip ${isEndorsed ? "endorsed" : ""} ${isSelected ? "selected" : ""}`}
                    onClick={() => toggleSkill(s)}
                    disabled={isEndorsed}
                    title={isEndorsed ? "Already endorsed" : "Click to endorse"}
                  >
                    {s}
                    {isEndorsed && <span style={{ marginLeft: 4, fontSize: 10 }}>✓</span>}
                  </button>
                );
              })}
            </div>
            {existing.length > 0 && (
              <p style={{ fontSize: 12, color: "var(--green)", marginTop: 8 }}>
                ✓ Already endorsed: {existing.join(", ")}
              </p>
            )}
          </div>

          {selected.length > 0 && (
            <button className="btn-primary full-width" onClick={handleEndorse} disabled={endorsing}>
              {endorsing ? "Endorsing…" : `Endorse ${selected.length} skill${selected.length > 1 ? "s" : ""} on-chain →`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
