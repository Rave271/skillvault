import { ethers } from "ethers";

/**
 * Generates a commit hash locally (mirrors Solidity's keccak256(abi.encodePacked(...)))
 * Used to show the user their hash before submitting to the contract.
 */
export function generateCommitHash(name, salt, email) {
  return ethers.keccak256(
    ethers.solidityPacked(["string", "string", "string"], [name, salt, email])
  );
}

/**
 * Generates a cryptographically random salt string
 */
export function generateSalt() {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Formats wei to a readable ETH string
 */
export function formatEth(wei) {
  return parseFloat(ethers.formatEther(wei)).toFixed(4) + " ETH";
}

/**
 * Truncates an Ethereum address for display
 */
export function shortAddress(addr) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";
}

/**
 * Returns time remaining from a unix deadline
 */
export function timeLeft(deadline) {
  const now = Math.floor(Date.now() / 1000);
  const diff = Number(deadline) - now;
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  return `${days}d ${hours}h remaining`;
}
