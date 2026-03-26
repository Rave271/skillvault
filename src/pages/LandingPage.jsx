const STEPS = [
  {
    n: "01",
    role: "Freelancer",
    title: "Commit your identity",
    body: "Hash your name and a secret salt locally. Only the commitment goes on-chain, so personal details stay hidden.",
  },
  {
    n: "02",
    role: "Employer",
    title: "Bid on pure skill",
    body: "Review skills, stake, and verified endorsements. Place an ETH bid without seeing any identity data.",
  },
  {
    n: "03",
    role: "Freelancer",
    title: "Accept the best offer",
    body: "Choose the strongest match, lock the agreement, and move the job into settlement with a transparent on-chain record.",
  },
  {
    n: "04",
    role: "Both",
    title: "Reveal and settle",
    body: "Reveal identity only after the match is set. The contract verifies the hash and releases payment once the work is complete.",
  },
];

export default function LandingPage({ onConnect }) {
  return (
    <div className="landing">
      <div className="ambient-bg ambient-bg-landing" aria-hidden="true">
        <div className="ambient-orb orb-primary" />
        <div className="ambient-orb orb-secondary" />
        <div className="ambient-grid" />
      </div>

      <nav className="nav">
        <div className="nav-logo">
          <span className="logo-icon">⬡</span>
          <div className="nav-brand">
            <span className="logo-text">SkillVault</span>
            <span className="logo-subtext">Privacy-first talent marketplace</span>
          </div>
        </div>

        <div className="nav-actions">
          <div className="nav-pill">Ethereum secured</div>
          <button className="btn-connect" onClick={onConnect}>
            Connect Wallet
          </button>
        </div>
      </nav>

      <main className="hero hero-grid">
        <section className="hero-copy">
          <div className="hero-tag">Powered by Ethereum · Bias-Free Hiring</div>

          <h1 className="hero-title">
            Your skills speak.
            <br />
            <span className="accent">Your identity stays protected.</span>
          </h1>

          <p className="hero-sub">
            SkillVault turns hiring into a clean, trust-minimized flow where employers
            bid on proof of ability, not pedigree. No names, no photos, no background bias,
            just verifiable skill signals and transparent settlement on-chain.
          </p>

          <div className="hero-actions">
            <button className="btn-primary" onClick={onConnect}>
              Launch App
            </button>
            <a href="#how" className="btn-ghost">
              Explore the flow
            </a>
          </div>

          <div className="trust-strip">
            <span>Commit-reveal cryptography</span>
            <span className="divider">·</span>
            <span>Escrow on Ethereum</span>
            <span className="divider">·</span>
            <span>Verified reputation signals</span>
          </div>

          <div className="hero-metrics">
            <div className="metric-card">
              <span className="metric-label">Visibility</span>
              <strong className="metric-value">Skills first</strong>
              <p className="metric-copy">Identity stays hidden until a match is accepted.</p>
            </div>
            <div className="metric-card">
              <span className="metric-label">Settlement</span>
              <strong className="metric-value">On-chain escrow</strong>
              <p className="metric-copy">Bids, release, disputes, and stake return are all recorded.</p>
            </div>
            <div className="metric-card">
              <span className="metric-label">Trust</span>
              <strong className="metric-value">Employer endorsements</strong>
              <p className="metric-copy">Past work turns into public proof without exposing the person.</p>
            </div>
          </div>
        </section>

        <aside className="hero-visual" aria-label="Platform preview">
          <div className="hero-visual-frame">
            <div className="visual-card visual-card-profile">
              <div className="visual-card-top">
                <span className="visual-kicker">Blind profile</span>
                <span className="visual-status">Live auction</span>
              </div>
              <h3>Smart Contract Engineer</h3>
              <div className="visual-skill-row">
                <span>Solidity</span>
                <span>React</span>
                <span>DeFi</span>
              </div>
              <div className="visual-metric-row">
                <div>
                  <span className="visual-metric-label">Minimum bid</span>
                  <strong>0.15 ETH</strong>
                </div>
                <div>
                  <span className="visual-metric-label">Stake</span>
                  <strong>0.015 ETH</strong>
                </div>
              </div>
            </div>

            <div className="visual-card visual-card-bid">
              <span className="visual-kicker">Employer offer</span>
              <strong className="visual-highlight">0.24 ETH</strong>
              <p>Frontend delivery for a DeFi dashboard with wallet and settlement flows.</p>
            </div>

            <div className="visual-card visual-card-flow">
              <span className="visual-kicker">Settlement path</span>
              <div className="flow-steps">
                <span>Commit</span>
                <span>Bid</span>
                <span>Reveal</span>
                <span>Release</span>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <section id="how" className="how-section">
        <div className="section-heading">
          <span className="section-kicker">Workflow</span>
          <h2 className="section-title">A hiring loop designed to reduce bias, not just talk about it</h2>
          <p className="section-copy">
            Every stage separates what stays private from what becomes public on-chain,
            so the hiring process stays fair, auditable, and easy to follow from start to finish.
          </p>
        </div>

        <div className="steps">
          {STEPS.map((step) => (
            <div key={step.n} className="step-card">
              <div className="step-number">{step.n}</div>
              <div className="step-role">{step.role}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-body">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="footer">
        <p>Built with Solidity, React, and ethers.js for a privacy-preserving hiring flow.</p>
      </footer>
    </div>
  );
}
