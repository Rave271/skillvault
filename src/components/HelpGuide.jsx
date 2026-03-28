import AppIcon from "./AppIcon";

const QUICK_START = [
  {
    icon: "browse",
    title: "Employers start in Browse",
    body: "Filter blind profiles by skills, endorsements, and reputation, then place a bid without seeing the freelancer's identity.",
  },
  {
    icon: "commit",
    title: "Freelancers start in Post Profile",
    body: "Commit your profile with private identity data hidden and only your skills, bid floor, and stake visible on-chain.",
  },
  {
    icon: "reveal",
    title: "Both sides finish in Settle",
    body: "After a match, reveal identity, release payment, handle disputes if needed, and reclaim the stake when the window closes.",
  },
];

const FLOW = [
  {
    step: "01",
    title: "Create or browse blind profiles",
    body: "Freelancers commit a profile privately. Employers only see skills, bid floor, endorsements, and stake-backed trust signals.",
  },
  {
    step: "02",
    title: "Place bids and accept the best match",
    body: "Employers submit a bid with a role description. Freelancers review offers in My Work and accept the strongest one.",
  },
  {
    step: "03",
    title: "Reveal identity only after matching",
    body: "The freelancer reveals the original committed details in Settle so the contract can verify the hash on-chain.",
  },
  {
    step: "04",
    title: "Release, dispute, or reclaim stake",
    body: "The employer releases payment, can raise a dispute during the 3-day window, and the freelancer reclaims stake if everything closes cleanly.",
  },
];

const TAB_GUIDE = [
  {
    icon: "overview",
    title: "Overview",
    body: "High-level status and a quick read on the current wallet session.",
  },
  {
    icon: "browse",
    title: "Browse",
    body: "Search open auctions and place bids as an employer.",
  },
  {
    icon: "commit",
    title: "Post Profile",
    body: "Create a new blind profile as a freelancer and lock the required stake.",
  },
  {
    icon: "work",
    title: "My Work",
    body: "Review your listings, incoming bids, accepted matches, and renewals.",
  },
  {
    icon: "reveal",
    title: "Settle",
    body: "Reveal identity, release payment, raise disputes, and reclaim stake.",
  },
  {
    icon: "endorse",
    title: "Endorse",
    body: "Verified employers record which skills a freelancer really demonstrated.",
  },
  {
    icon: "history",
    title: "History",
    body: "Audit the on-chain event trail and jump to Etherscan.",
  },
];

export default function HelpGuide() {
  return (
    <div className="help-guide">
      <section className="panel help-hero">
        <div className="help-hero-lockup">
          <AppIcon name="help" className="help-hero-icon" />
          <span>Guide</span>
        </div>
        <h2 className="panel-title">How SkillVault works</h2>
        <p className="panel-sub">
          SkillVault is a blind hiring marketplace on Ethereum. The core idea is simple:
          skills are visible first, identity is revealed only after a match, and settlement
          happens transparently on-chain.
        </p>

        <div className="help-quick-grid">
          {QUICK_START.map((item) => (
            <div key={item.title} className="help-quick-card">
              <div className="help-card-icon">
                <AppIcon name={item.icon} />
              </div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Recommended flow</h2>
            <p className="panel-sub" style={{ marginBottom: 0 }}>
              Follow this sequence if you want to use the app without guessing where to go next.
            </p>
          </div>
        </div>

        <div className="help-flow-grid">
          {FLOW.map((item) => (
            <div key={item.step} className="help-flow-card">
              <span className="help-flow-step">{item.step}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">What each tab is for</h2>
            <p className="panel-sub" style={{ marginBottom: 0 }}>
              Use this as the quick map whenever you are not sure which screen handles the next action.
            </p>
          </div>
        </div>

        <div className="help-tab-grid">
          {TAB_GUIDE.map((item) => (
            <div key={item.title} className="help-tab-card">
              <div className="help-card-icon">
                <AppIcon name={item.icon} />
              </div>
              <div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Important things to remember</h2>
          </div>
        </div>

        <div className="help-notes">
          <div className="info-box">
            Save the original name, email, and salt used during profile commit. Without them,
            the freelancer cannot pass identity reveal later.
          </div>
          <div className="info-box">
            The employer can endorse skills only after a job has actually closed. That keeps the
            reputation system tied to verified work instead of self-claims.
          </div>
          <div className="warn-box">
            Payment release starts the dispute window. If you are the employer, only release after
            you are satisfied with the delivered work.
          </div>
        </div>
      </section>
    </div>
  );
}
