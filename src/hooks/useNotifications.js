import { useEffect, useRef } from "react";

/**
 * useNotifications
 * Listens to on-chain events from the contract and fires
 * browser push notifications when relevant activity occurs
 * for the connected wallet.
 */
export default function useNotifications(contract, account) {
  const listening = useRef(false);

  useEffect(() => {
    if (!contract || !account || listening.current) return;
    listening.current = true;

    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    function notify(title, body) {
      if (Notification.permission === "granted") {
        new Notification(title, { body, icon: "/favicon.ico" });
      }
    }

    // ── Bid placed on freelancer's profile ──
    contract.on("BidPlaced", (auctionId, bidId, employer, amount) => {
      contract.auctions(auctionId).then((auction) => {
        contract.profiles(auction[0]).then((profile) => {
          if (profile[4].toLowerCase() === account.toLowerCase()) {
            const eth = (Number(amount) / 1e18).toFixed(4);
            notify("New bid on your profile", `Auction #${auctionId} — ${eth} ETH bid received`);
          }
        });
      });
    });

    // ── Bid accepted — notify employer ──
    contract.on("AuctionMatched", (auctionId, bidId, employer) => {
      if (employer.toLowerCase() === account.toLowerCase()) {
        notify("Your bid was accepted", `Auction #${auctionId} — the freelancer accepted your offer`);
      }
    });

    // ── Identity revealed — notify employer ──
    contract.on("IdentityRevealed", (profileId, freelancer, name) => {
      contract.auctions(profileId).then((auction) => {
        const winBidId = Number(auction[3]);
        if (winBidId > 0) {
          contract.getBid(profileId, winBidId).then((bid) => {
            if (bid[0].toLowerCase() === account.toLowerCase()) {
              notify("Freelancer identity revealed", `${name} has revealed. You can now release payment.`);
            }
          });
        }
      });
    });

    // ── Payment released — notify freelancer ──
    contract.on("PaymentReleased", (auctionId, freelancer, amount) => {
      if (freelancer.toLowerCase() === account.toLowerCase()) {
        const eth = (Number(amount) / 1e18).toFixed(4);
        notify("Payment received", `Auction #${auctionId} — ${eth} ETH sent to your wallet`);
      }
    });

    // ── Dispute raised — notify freelancer ──
    contract.on("DisputeRaised", (auctionId, raisedBy, reason) => {
      contract.auctions(auctionId).then((auction) => {
        contract.profiles(auction[0]).then((profile) => {
          if (profile[4].toLowerCase() === account.toLowerCase()) {
            notify("Dispute raised against you", `Auction #${auctionId} — "${reason}". Arbitration pending.`);
          }
        });
      });
    });

    // ── Dispute resolved ──
    contract.on("DisputeResolved", (auctionId, result, penalised) => {
      if (penalised.toLowerCase() === account.toLowerCase()) {
        notify("Dispute resolved — you lost", `Auction #${auctionId} — stake penalised, reputation reduced.`);
      } else {
        contract.auctions(auctionId).then((auction) => {
          contract.profiles(auction[0]).then((profile) => {
            const isFreelancer = profile[4].toLowerCase() === account.toLowerCase();
            contract.getBid(auctionId, Number(auction[3])).then((bid) => {
              const isEmployer = bid[0].toLowerCase() === account.toLowerCase();
              if (isFreelancer || isEmployer) {
                notify("Dispute resolved — you won", `Auction #${auctionId} — found in your favour.`);
              }
            });
          });
        });
      }
    });

    // ── Auction expired — notify freelancer ──
    contract.on("AuctionExpired", (auctionId, profileId, freelancer) => {
      if (freelancer.toLowerCase() === account.toLowerCase()) {
        notify("Your auction expired", `Auction #${auctionId} received no bids. Stake returned. You can renew.`);
      }
    });

    // ── Auction renewed ──
    contract.on("AuctionRenewed", (auctionId, profileId, newDeadline, renewCount) => {
      contract.profiles(profileId).then((profile) => {
        if (profile[4].toLowerCase() === account.toLowerCase()) {
          notify("Auction renewed", `Auction #${auctionId} is live again for 7 more days (${renewCount}/3).`);
        }
      });
    });

    // ── Skill endorsed ──
    contract.on("SkillEndorsed", (auctionId, freelancer, employer, skill, newCount) => {
      if (freelancer.toLowerCase() === account.toLowerCase()) {
        notify("Skill endorsed", `${skill} endorsed by a verified employer — total: ${newCount}`);
      }
    });

    return () => {
      contract.removeAllListeners();
      listening.current = false;
    };
  }, [contract, account]);
}
