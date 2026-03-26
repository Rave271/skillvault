import { useState } from "react";
import { generateCommitHash, formatEth } from "../utils/helpers";

export default function RevealIdentity({ contract, account, notify }) {
  const [profileId, setProfileId] = useState("");
  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [salt, setSalt]           = useState("");
  const [previewHash, setPreviewHash] = useState("");
  const [loading, setLoading]     = useState(false);
  const [mode, setMode]           = useState("reveal"); // reveal | release | dispute | stake
  const [disputeReason, setDisputeReason] = useState("");

  function computePreview() {
    if (name && email && salt) setPreviewHash(generateCommitHash(name, salt, email));
  }

  async function handleReveal() {
    if (!profileId || !name || !email || !salt) { notify("Fill all fields", "error"); return; }
    try {
      setLoading(true);
      notify("Verifying hash on-chain…", "pending");
      const tx = await contract.revealIdentity(profileId, name, salt, email);
      await tx.wait();
      notify("Identity revealed! Employer can now release payment.", "success");
    } catch (e) {
      notify(e.reason || e.message || "Reveal failed — check name/salt/email match exactly", "error");
    } finally { setLoading(false); }
  }

  async function handleRelease() {
    if (!profileId) { notify("Enter auction ID", "error"); return; }
    try {
      setLoading(true);
      notify("Releasing payment…", "pending");
      const tx = await contract.releasePayment(profileId);
      await tx.wait();
      notify("Payment released! Stake window opens — freelancer can reclaim stake in 3 days.", "success");
    } catch (e) {
      notify(e.reason || e.message || "Release failed", "error");
    } finally { setLoading(false); }
  }

  async function handleDispute() {
    if (!profileId || !disputeReason) { notify("Enter auction ID and reason", "error"); return; }
    try {
      setLoading(true);
      notify("Raising dispute on-chain…", "pending");
      const tx = await contract.raiseDispute(profileId, disputeReason);
      await tx.wait();
      notify("Dispute raised. Arbitrator (contract owner) will resolve it.", "success");
    } catch (e) {
      notify(e.reason || e.message || "Dispute failed", "error");
    } finally { setLoading(false); }
  }

  async function handleReturnStake() {
    if (!profileId) { notify("Enter auction ID", "error"); return; }
    try {
      setLoading(true);
      // Check if eligible first
      const canReturn = await contract.canReturnStake(profileId);
      if (!canReturn) {
        notify("Stake cannot be returned yet — either dispute window (3 days) hasn't passed or a dispute was raised.", "error");
        return;
      }
      notify("Returning stake…", "pending");
      const tx = await contract.returnStake(profileId);
      await tx.wait();
      notify("Stake returned to your wallet!", "success");
    } catch (e) {
      notify(e.reason || e.message || "Failed", "error");
    } finally { setLoading(false); }
  }

  const MODES = [
    { id: "reveal",  label: "Reveal Identity",   role: "Freelancer" },
    { id: "release", label: "Release Payment",   role: "Employer" },
    { id: "dispute", label: "Raise Dispute",     role: "Employer" },
    { id: "stake",   label: "Reclaim Stake",     role: "Freelancer" },
  ];

  return (
    <div className="panel">
      <h2 className="panel-title">Reveal &amp; Settlement</h2>
      <p className="panel-sub">Identity verification, payment release, dispute management, and stake recovery.</p>

      <div className="mode-toggle-grid">
        {MODES.map(m => (
          <button key={m.id}
            className={mode === m.id ? "mode-tile active" : "mode-tile"}
            onClick={() => setMode(m.id)}>
            <span className="mode-role">{m.role}</span>
            <span className="mode-label">{m.label}</span>
          </button>
        ))}
      </div>

      {/* ── Reveal ── */}
      {mode === "reveal" && (
        <div className="reveal-form">
          <div className="info-box">
            The contract recomputes <code>keccak256(name + salt + email)</code> and compares it to your committed hash.
            Inputs must be byte-for-byte identical to what you entered during commit.
          </div>
          <div className="form-group">
            <label>Profile ID</label>
            <input type="number" value={profileId} onChange={e => setProfileId(e.target.value)} placeholder="1" />
          </div>
          <div className="form-group">
            <label>Real Name (exactly as committed)</label>
            <input value={name} onChange={e => { setName(e.target.value); computePreview(); }} placeholder="Priya Sharma" />
          </div>
          <div className="form-group">
            <label>Salt</label>
            <input value={salt} onChange={e => { setSalt(e.target.value); computePreview(); }} placeholder="a3f8c2…" />
          </div>
          <div className="form-group">
            <label>Email (exactly as committed)</label>
            <input value={email} onChange={e => { setEmail(e.target.value); computePreview(); }} placeholder="you@example.com" />
          </div>
          {previewHash && (
            <div className="hash-display">
              <span className="hash-label">Preview hash — compare with your commit</span>
              <code className="hash-code">{previewHash}</code>
            </div>
          )}
          <button className="btn-primary full-width" onClick={handleReveal} disabled={loading}>
            {loading ? "Verifying…" : "Reveal Identity"}
          </button>
        </div>
      )}

      {/* ── Release Payment ── */}
      {mode === "release" && (
        <div className="reveal-form">
          <div className="info-box">
            Once the freelancer has revealed their identity, release the escrowed ETH.
            This starts a 3-day window during which you can raise a dispute if work was not delivered.
          </div>
          <div className="form-group">
            <label>Auction ID</label>
            <input type="number" value={profileId} onChange={e => setProfileId(e.target.value)} placeholder="1" />
          </div>
          <button className="btn-primary full-width" onClick={handleRelease} disabled={loading}>
            {loading ? "Releasing…" : "Release Payment →"}
          </button>
        </div>
      )}

      {/* ── Dispute ── */}
      {mode === "dispute" && (
        <div className="reveal-form">
          <div className="warn-box">
            Only raise a dispute if the freelancer did not deliver the agreed work.
            You must raise it within 3 days of releasing payment.
            The contract owner acts as arbitrator and will review both sides.
          </div>
          <div className="form-group">
            <label>Auction ID</label>
            <input type="number" value={profileId} onChange={e => setProfileId(e.target.value)} placeholder="1" />
          </div>
          <div className="form-group">
            <label>Reason for dispute</label>
            <textarea rows={3} value={disputeReason}
              onChange={e => setDisputeReason(e.target.value)}
              placeholder="Describe what was agreed and what was not delivered…" />
          </div>
          <button className="btn-primary full-width" onClick={handleDispute} disabled={loading}
            style={{ background: "rgba(248,113,113,0.15)", color: "var(--red)", border: "1px solid rgba(248,113,113,0.3)" }}>
            {loading ? "Submitting…" : "Raise Dispute"}
          </button>
        </div>
      )}

      {/* ── Reclaim Stake ── */}
      {mode === "stake" && (
        <div className="reveal-form">
          <div className="info-box">
            After payment is released and 3 days pass with no dispute, you can reclaim your reputation stake.
            The contract verifies the window has elapsed before releasing funds.
          </div>
          <div className="form-group">
            <label>Auction ID</label>
            <input type="number" value={profileId} onChange={e => setProfileId(e.target.value)} placeholder="1" />
          </div>
          <button className="btn-primary full-width" onClick={handleReturnStake} disabled={loading}>
            {loading ? "Checking…" : "Reclaim Stake →"}
          </button>
        </div>
      )}
    </div>
  );
}
