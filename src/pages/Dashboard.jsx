import { useState, useEffect } from "react";
import { shortAddress } from "../utils/helpers";
import useNotifications from "../hooks/useNotifications";
import CommitProfile from "../components/CommitProfile";
import BrowseAuctions from "../components/BrowseAuctions";
import MyProfiles from "../components/MyProfiles";
import RevealIdentity from "../components/RevealIdentity";
import History from "../components/History";
import Endorse from "../components/Endorse";
import HelpGuide from "../components/HelpGuide";
import BrandMark from "../components/BrandMark";
import AppIcon from "../components/AppIcon";

const TABS = [
  { id: "overview", label: "Overview", icon: "overview" },
  { id: "browse", label: "Browse", icon: "browse" },
  { id: "commit", label: "Post Profile", icon: "commit" },
  { id: "mine", label: "My Work", icon: "work" },
  { id: "reveal", label: "Settle", icon: "reveal" },
  { id: "endorse", label: "Endorse", icon: "endorse" },
  { id: "history", label: "History", icon: "history" },
  { id: "help", label: "Help", icon: "help" },
];

export default function Dashboard({ account, contract }) {
  const [tab, setTab] = useState("browse");
  const [txStatus, setTxStatus] = useState(null);
  const [reputation, setReputation] = useState(null);

  useNotifications(contract, account);

  useEffect(() => {
    if (!contract || !account) return;

    let ignore = false;

    async function loadReputation() {
      try {
        const rep = await contract.getReputation(account);

        if (!ignore) {
          setReputation(Number(rep));
        }
      } catch {
        // Ignore transient network or wallet state while the session stabilizes.
      }
    }

    loadReputation();

    return () => {
      ignore = true;
    };
  }, [contract, account]);

  function notify(msg, type = "success") {
    setTxStatus({ msg, type });

    if (type === "error") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }

    if (type !== "pending") {
      setTimeout(() => setTxStatus(null), 5000);
    }
  }

  function repColor(value) {
    if (value > 0) return "var(--green)";
    if (value < 0) return "var(--red)";
    return "var(--dim)";
  }

  function renderTabContent() {
    if (tab === "overview") {
      return (
        <>
          <section className="dashboard-hero">
            <div className="dashboard-hero-copy">
              <div className="dashboard-lockup">
                <BrandMark className="brand-mark-mini" />
                <span>Control room</span>
              </div>
              <span className="section-kicker">Workspace</span>
              <h1 className="dashboard-title">Run private talent auctions from a workspace built like a trust desk.</h1>
              <p className="dashboard-copy">
                Post anonymous profiles, review live bids, settle completed matches, and
                grow on-chain reputation from one lit, high-clarity workspace.
              </p>
            </div>

            <div className="dashboard-hero-grid">
              <div className="dashboard-stat-card">
                <span className="dashboard-stat-label">Screening mode</span>
                <strong className="dashboard-stat-value">Commit until reveal</strong>
                <p className="dashboard-stat-copy">Profiles surface skills and stake first, personal data later.</p>
              </div>
              <div className="dashboard-stat-card">
                <span className="dashboard-stat-label">Settlement rail</span>
                <strong className="dashboard-stat-value">Escrow and release</strong>
                <p className="dashboard-stat-copy">Bids, acceptance, disputes, and stake return stay on-chain.</p>
              </div>
              <div className="dashboard-stat-card">
                <span className="dashboard-stat-label">Live session</span>
                <strong className="dashboard-stat-value">{shortAddress(account)}</strong>
                <p className="dashboard-stat-copy">
                  Reputation {reputation === null ? "loading..." : reputation > 0 ? `+${reputation}` : reputation}
                </p>
              </div>
            </div>
          </section>

          <div className="panel panel-overview-note">
            <h2 className="panel-title">Overview</h2>
            <p className="panel-sub" style={{ marginBottom: 0 }}>
              Use the tabs above to jump straight into browsing auctions, posting a profile,
              settling jobs, or reviewing history.
            </p>
          </div>
        </>
      );
    }

    if (tab === "browse") {
      return <BrowseAuctions contract={contract} account={account} notify={notify} />;
    }

    if (tab === "commit") {
      return <CommitProfile contract={contract} notify={notify} />;
    }

    if (tab === "mine") {
      return <MyProfiles contract={contract} account={account} notify={notify} />;
    }

    if (tab === "reveal") {
      return <RevealIdentity contract={contract} account={account} notify={notify} />;
    }

    if (tab === "endorse") {
      return <Endorse contract={contract} account={account} notify={notify} />;
    }

    if (tab === "history") {
      return <History contract={contract} account={account} />;
    }

    return <HelpGuide />;
  }

  return (
    <div className="dashboard">
      <div className="ambient-bg ambient-bg-dashboard" aria-hidden="true">
        <div className="ambient-orb orb-primary" />
        <div className="ambient-orb orb-secondary" />
        <div className="ambient-beam beam-left" />
        <div className="ambient-beam beam-center" />
        <div className="ambient-beam beam-right" />
        <div className="ambient-grid" />
        <div className="ambient-vignette" />
      </div>

      <header className="dash-header">
        <div className="nav-logo">
          <BrandMark />
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
        <div className="tab-nav-shell">
          <div className="tab-nav-inner">
            {TABS.map((tabItem) => (
              <button
                key={tabItem.id}
                className={`tab-btn ${tab === tabItem.id ? "active" : ""}`}
                onClick={() => setTab(tabItem.id)}
              >
                <span className="tab-icon">
                  <AppIcon name={tabItem.icon} />
                </span>
                {tabItem.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {txStatus && (
        <div className={`toast toast-${txStatus.type}`} role="status" aria-live="polite">
          {txStatus.type === "pending" && <span className="spinner" />}
          {txStatus.msg}
        </div>
      )}

      <main className="dash-content">
        <div key={tab} className="dashboard-stage">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
}
