import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./utils/contract";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import "./index.css";

export default function App() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [page, setPage] = useState("landing"); // landing | dashboard

  async function connectWallet() {
    if (!window.ethereum) {
      alert("MetaMask not found. Please install it to continue.");
      return;
    }
    const _provider = new ethers.BrowserProvider(window.ethereum);
    await _provider.send("eth_requestAccounts", []);
    const _signer = await _provider.getSigner();
    const _account = await _signer.getAddress();
    const _contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, _signer);

    setProvider(_provider);
    setSigner(_signer);
    setAccount(_account);
    setContract(_contract);
    setPage("dashboard");
  }

  // Auto-reconnect if already authorised
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: "eth_accounts" }).then((accounts) => {
        if (accounts.length > 0) connectWallet();
      });
    }
  }, []);

  return (
    <div className="app">
      {page === "landing" ? (
        <LandingPage onConnect={connectWallet} />
      ) : (
        <Dashboard account={account} contract={contract} />
      )}
    </div>
  );
}
