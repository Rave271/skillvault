import { useState, useEffect } from "react";
import { shortAddress } from "../utils/helpers";
import useNotifications from "../hooks/useNotifications";
import CommitProfile from "../components/CommitProfile";
import BrowseAuctions from "../components/BrowseAuctions";
import MyProfiles from "../components/MyProfiles";
import RevealIdentity from "../components/RevealIdentity";
import History from "../components/History";
import Endorse from "../components/Endorse";

const TABS = [
  { id: "overview", label: "Overview", icon: "◌" },
  { id: "browse", label: "Browse", icon: "◈" },
  { id: "commit", label: "Post Profile", icon: "◎" },
  { id: "mine", label: "My Work", icon: "◉" },
  { id: "reveal", label: "Settle", icon: "◇" },
  { id: "endorse", label: "Endorse", icon: "★" },
  { id: "history", label: "History", icon: "⬡" },
];

export default function Dashboard({ account, contract }) {
  const [tab, setTab] = useState("browse");
  const [txStatus, setTxStatus] = useState(null);
  const [reputation, setReputation] = useState(null);

  useNotifications(contract, account);

  useEffect(() => {
    if (contract && account) loadReputation();
  }, [contract, account]);

  async function loadReputation() {
    try {
      const rep = await contract.getReputation(account);
      setReputation(Number(rep));
    } catch {}
  }

  function notify(msg, type = "success") {
    setTxStatus({ msg, type });
    if (type !== "pending") {
      setTimeout(() => setTxStatus(null), 5000);
    }
  }

  function repColor(value) {
    if (value > 0) return "var(--green)";
    if (value < 0) return "var(--red)";
    return "var(--dim)";
  }

  return (
    <div className="dashboard">
      <div className="ambient-bg ambient-bg-dashboard" aria-hidden="true">
        <div className="ambient-orb orb-primary" />
        <div className="ambient-orb orb-secondary" />
        <div className="ambient-grid" />
      </div>

      <header className="dash-header">
        <div className="nav-logo">
          <span className="logo-icon">⬡</span>
          <div className="nav-brand">
            <span className="logo-text">SkillVault</span>
            <span className="logo-subtext">Blind hiring control room</span>
          </div>
        </div>

        <div className="header-right">
          {reputation !== null && (
            <div className="rep-pill" style={{ color: repColor(reputation) }}>
              Rep {reputation > 0 ? `+${reputation}` : reputation}
            </div>
          )}

          <div className="wallet-pill">
            <span className="wallet-dot" />
            {shortAddress(account)}
          </div>
        </div>
      </header>

      <nav className="tab-nav">
        <div className="tab-nav-inner">
          {TABS.map((tabItem) => (
            <button
              key={tabItem.id}
              className={`tab-btn ${tab === tabItem.id ? "active" : ""}`}
              onClick={() => setTab(tabItem.id)}
            >
              <span className="tab-icon">{tabItem.icon}</span>
              {tabItem.label}
            </button>
          ))}
        </div>
      </nav>

      {txStatus && (
        <div className={`toast toast-${txStatus.type}`}>
          {txStatus.type === "pending" && <span className="spinner" />}
          {txStatus.msg}
        </div>
      )}

      <main className="dash-content">
        {tab === "overview" && (
          <section className="dashboard-hero">
            <div className="dashboard-hero-copy">
              <span className="section-kicker">Workspace</span>
              <h1 className="dashboard-title">Manage private talent auctions with clearer state and stronger visual trust.</h1>
              <p className="dashboard-copy">
                Post anonymous profiles, review active bids, settle completed matches, and
                grow on-chain reputation from one focused workspace.
              </p>
            </div>

            <div className="dashboard-hero-grid">
              <div className="dashboard-stat-card">
                <span className="dashboard-stat-label">Identity model</span>
                <strong className="dashboard-stat-value">Commit until reveal</strong>
                <p className="dashboard-stat-copy">Profiles show skills and stake first, personal data later.</p>
              </div>
              <div className="dashboard-stat-card">
                <span className="dashboard-stat-label">Payment flow</span>
                <strong className="dashboard-stat-value">Escrow and release</strong>
                <p className="dashboard-stat-copy">Bids, acceptance, disputes, and stake return stay on-chain.</p>
              </div>
              <div className="dashboard-stat-card">
                <span className="dashboard-stat-label">Connected wallet</span>
                <strong className="dashboard-stat-value">{shortAddress(account)}</strong>
                <p className="dashboard-stat-copy">
                  Reputation {reputation === null ? "loading..." : reputation > 0 ? `+${reputation}` : reputation}
                </p>
              </div>
            </div>
          </section>
        )}

        {tab === "overview" && <div className="panel panel-overview-note">
          <h2 className="panel-title">Overview</h2>
          <p className="panel-sub" style={{ marginBottom: 0 }}>
            Use the tabs above to jump straight into browsing auctions, posting a profile,
            settling jobs, or reviewing history.
          </p>
        </div>}
        {tab === "browse" && (
          <BrowseAuctions contract={contract} account={account} notify={notify} />
        )}
        {tab === "commit" && <CommitProfile contract={contract} notify={notify} />}
        {tab === "mine" && (
          <MyProfiles contract={contract} account={account} notify={notify} />
        )}
        {tab === "reveal" && (
          <RevealIdentity contract={contract} account={account} notify={notify} />
        )}
        {tab === "endorse" && (
          <Endorse contract={contract} account={account} notify={notify} />
        )}
        {tab === "history" && (
          <History contract={contract} account={account} />
        )}
      </main>
    </div>
  );
}
