export const CONTRACT_ADDRESS = "0x89E8723120dF6D7c8285BeC3c98BBe2c2c36f981";

export const CONTRACT_ABI = [
  // ── Core ──
  "function commitProfile(bytes32 commitHash, string encryptedSkills, uint256 minBidWei) payable returns (uint256)",
  "function revealIdentity(uint256 profileId, string realName, string salt, string contactEmail)",
  "function placeBid(uint256 auctionId, string jobDescription) payable",
  "function withdrawBid(uint256 auctionId, uint256 bidId)",
  "function acceptBid(uint256 auctionId, uint256 bidId)",
  "function releasePayment(uint256 auctionId)",
  // ── Expiry & Renewal ──
  "function expireAuction(uint256 auctionId)",
  "function renewAuction(uint256 auctionId) payable",
  "function isExpired(uint256 auctionId) view returns (bool)",
  "function canRenew(uint256 auctionId) view returns (bool)",
  // ── Staking ──
  "function requiredStake(uint256 minBidWei) pure returns (uint256)",
  "function returnStake(uint256 auctionId)",
  "function canReturnStake(uint256 auctionId) view returns (bool)",
  // ── Disputes ──
  "function raiseDispute(uint256 auctionId, string reason)",
  "function resolveDispute(uint256 auctionId, bool employerWins)",
  "function getDispute(uint256 auctionId) view returns (address, string, uint256, uint8)",
  // ── Endorsements ──
  "function endorseSkill(uint256 auctionId, string skill)",
  "function getEndorsements(address freelancer) view returns (string[], uint256[])",
  "function hasEndorsed(address employer, address freelancer, string skill) view returns (bool)",
  // ── Views ──
  "function generateCommitHash(string name, string salt, string email) pure returns (bytes32)",
  "function getBid(uint256 auctionId, uint256 bidId) view returns (address, uint256, string, bool, bool)",
  "function profiles(uint256) view returns (bytes32, string, uint256, uint256, address, bool, bool, string)",
  "function auctions(uint256) view returns (uint256, uint8, uint256, uint256, uint256, uint256, uint256)",
  "function profileCount() view returns (uint256)",
  "function auctionCount() view returns (uint256)",
  "function getFreelancerProfiles(address) view returns (uint256[])",
  "function getReputation(address) view returns (int256)",
  // ── Events ──
  "event ProfileCommitted(uint256 indexed profileId, address indexed freelancer, string skills, uint256 stake)",
  "event AuctionCreated(uint256 indexed auctionId, uint256 indexed profileId, uint256 deadline)",
  "event BidPlaced(uint256 indexed auctionId, uint256 indexed bidId, address indexed employer, uint256 amount)",
  "event BidWithdrawn(uint256 indexed auctionId, uint256 indexed bidId, address employer)",
  "event AuctionMatched(uint256 indexed auctionId, uint256 indexed bidId, address employer)",
  "event IdentityRevealed(uint256 indexed profileId, address indexed freelancer, string name)",
  "event PaymentReleased(uint256 indexed auctionId, address freelancer, uint256 amount)",
  "event StakeReturned(uint256 indexed profileId, address freelancer, uint256 amount)",
  "event DisputeRaised(uint256 indexed auctionId, address raisedBy, string reason)",
  "event DisputeResolved(uint256 indexed auctionId, uint8 result, address penalised)",
  "event ReputationUpdated(address indexed user, int256 newScore)",
  "event SkillEndorsed(uint256 indexed auctionId, address indexed freelancer, address indexed employer, string skill, uint256 newCount)",
  "event AuctionExpired(uint256 indexed auctionId, uint256 indexed profileId, address freelancer)",
  "event AuctionRenewed(uint256 indexed auctionId, uint256 indexed profileId, uint256 newDeadline, uint256 renewCount)",
];

export const AuctionState = {
  0: "Open", 1: "Matched", 2: "Revealed", 3: "Closed", 4: "Disputed", 5: "Expired",
};

export const DisputeResult = {
  0: "Pending", 1: "FreelancerWon", 2: "EmployerWon",
};