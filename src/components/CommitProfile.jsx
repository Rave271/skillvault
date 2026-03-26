import { useState } from "react";
import { ethers } from "ethers";
import { generateSalt, generateCommitHash } from "../utils/helpers";

const SKILL_OPTIONS = [
  "Solidity", "React", "Node.js", "Python", "Rust", "Go",
  "Smart Contracts", "DeFi", "Machine Learning", "DevOps",
  "UI/UX Design", "Data Science", "Cybersecurity", "Mobile Dev"
];

export default function CommitProfile({ contract, notify }) {
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [skills, setSkills]   = useState([]);
  const [customSkill, setCustomSkill] = useState("");
  const [minBid, setMinBid]   = useState("");
  const [salt, setSalt]       = useState(generateSalt());
  const [commitHash, setCommitHash] = useState("");
  const [stakeAmount, setStakeAmount] = useState("");
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [savedData, setSavedData] = useState(null);

  function toggleSkill(s) {
    setSkills(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
  }

  function addCustomSkill() {
    if (customSkill && !skills.includes(customSkill)) {
      setSkills(p => [...p, customSkill]);
      setCustomSkill("");
    }
  }

  async function handlePrepare() {
    if (!name || !email || skills.length === 0 || !minBid) {
      notify("Please fill all fields and select at least one skill.", "error");
      return;
    }
    const hash = generateCommitHash(name, salt, email);
    setCommitHash(hash);

    // Calculate required stake from contract
    try {
      const minBidWei = ethers.parseEther(minBid);
      const stake = await contract.requiredStake(minBidWei);
      setStakeAmount(ethers.formatEther(stake));
    } catch {
      // Fallback: 10% locally
      setStakeAmount((parseFloat(minBid) * 0.1).toFixed(6));
    }

    setSavedData({ name, email, salt, skills: skills.join(", ") });
    setStep(2);
  }

  async function handleCommit() {
    if (!contract) return;
    try {
      setLoading(true);
      notify("Submitting transaction…", "pending");
      const minBidWei   = ethers.parseEther(minBid);
      const stakeWei    = await contract.requiredStake(minBidWei);
      const skillStr    = skills.join(", ");
      const tx = await contract.commitProfile(commitHash, skillStr, minBidWei, {
        value: stakeWei
      });
      await tx.wait();
      notify("Profile committed on-chain! Save your credentials.", "success");
      setStep(3);
    } catch (e) {
      notify(e.reason || e.message || "Transaction failed", "error");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep(1); setSkills([]); setName(""); setEmail(""); setMinBid("");
    setSalt(generateSalt()); setCommitHash(""); setStakeAmount("");
  }

  if (step === 3) {
    return (
      <div className="panel success-panel">
        <div className="success-icon">✓</div>
        <h2>Profile committed on-chain</h2>
        <p>Your identity is hidden. Your reputation stake is locked until the job closes cleanly.</p>
        <div className="save-box">
          <h4>Save this — required for identity reveal</h4>
          <div className="save-row"><span>Name</span><code>{savedData.name}</code></div>
          <div className="save-row"><span>Email</span><code>{savedData.email}</code></div>
          <div className="save-row"><span>Salt</span><code>{savedData.salt}</code></div>
          <div className="save-row"><span>Skills</span><code>{savedData.skills}</code></div>
        </div>
        <button className="btn-primary" onClick={reset}>Post Another Profile</button>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="panel">
        <h2 className="panel-title">Review &amp; Confirm</h2>
        <p className="panel-sub">Your hash and stake are shown below. Once submitted, your stake is locked on-chain.</p>

        <div className="hash-display">
          <span className="hash-label">Commit Hash (public)</span>
          <code className="hash-code">{commitHash}</code>
        </div>

        <div className="confirm-table">
          <div className="cr"><span>Visible skills</span><strong>{skills.join(", ")}</strong></div>
          <div className="cr"><span>Minimum bid</span><strong>{minBid} ETH</strong></div>
          <div className="cr">
            <span>Reputation stake</span>
            <strong style={{ color: "var(--amber)" }}>{stakeAmount} ETH <span style={{ fontWeight: 400, fontSize: 12 }}>(locked, returned on clean close)</span></strong>
          </div>
          <div className="cr"><span>Hidden: name</span><strong>🔒 Encrypted</strong></div>
          <div className="cr"><span>Hidden: email</span><strong>🔒 Encrypted</strong></div>
          <div className="cr"><span>Salt</span><strong><code>{salt}</code></strong></div>
        </div>

        <div className="info-box" style={{ marginBottom: "1rem" }}>
          The stake ({stakeAmount} ETH) is sent alongside this transaction as msg.value. It stays locked in the
          contract until the job closes. If you deliver successfully, it returns to you after 3 days.
          If a dispute is raised and upheld, it goes to the employer.
        </div>

        <div className="warn-box">
          Copy and save your name, salt, and email. Without them you cannot pass identity verification.
        </div>

        <div className="btn-row">
          <button className="btn-ghost" onClick={() => setStep(1)}>← Edit</button>
          <button className="btn-primary" onClick={handleCommit} disabled={loading}>
            {loading ? "Submitting…" : `Commit + Stake ${stakeAmount} ETH`}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2 className="panel-title">Post a Blind Profile</h2>
      <p className="panel-sub">
        Your name and contact are hidden on-chain. A small reputation stake (10% of your minimum bid)
        is locked as a trust bond — returned to you after successful delivery.
      </p>

      <div className="form-group">
        <label>Your Real Name <span className="private-tag">private</span></label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Priya Sharma" />
      </div>

      <div className="form-group">
        <label>Contact Email <span className="private-tag">private</span></label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
      </div>

      <div className="form-group">
        <label>Skills <span className="public-tag">visible on-chain</span></label>
        <div className="skill-grid">
          {SKILL_OPTIONS.map(s => (
            <button key={s} className={`skill-chip ${skills.includes(s) ? "selected" : ""}`}
              onClick={() => toggleSkill(s)} type="button">{s}</button>
          ))}
        </div>
        <div className="custom-skill-row">
          <input value={customSkill} onChange={e => setCustomSkill(e.target.value)}
            placeholder="Add custom skill…" onKeyDown={e => e.key === "Enter" && addCustomSkill()} />
          <button className="btn-ghost-sm" onClick={addCustomSkill}>Add</button>
        </div>
        {skills.length > 0 && (
          <div className="selected-skills">
            {skills.map(s => (
              <span key={s} className="selected-skill-tag">{s}
                <button onClick={() => toggleSkill(s)}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="form-group">
        <label>Minimum Bid <span className="public-tag">visible on-chain</span></label>
        <div className="input-suffix">
          <input type="number" step="0.001" value={minBid}
            onChange={e => setMinBid(e.target.value)} placeholder="0.05" />
          <span>ETH</span>
        </div>
        {minBid && (
          <p style={{ fontSize: 12, color: "var(--amber)", marginTop: 6 }}>
            Reputation stake required: {(parseFloat(minBid) * 0.1).toFixed(6)} ETH (10%)
          </p>
        )}
      </div>

      <div className="form-group">
        <label>Salt <span className="private-tag">private — save this</span></label>
        <div className="salt-row">
          <code className="salt-display">{salt}</code>
          <button className="btn-ghost-sm" onClick={() => setSalt(generateSalt())}>↺ New</button>
        </div>
      </div>

      <button className="btn-primary full-width" onClick={handlePrepare}>
        Preview &amp; Calculate Stake →
      </button>
    </div>
  );
}
