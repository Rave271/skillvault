// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title BlindSkillAuction v2
 * @notice Bias-free hiring marketplace with commit-reveal identity,
 *         reputation staking, and on-chain dispute arbitration.
 *
 * NEW IN V2:
 *  - Freelancers lock a stake (10% of minBid) when posting a profile.
 *    Stake is returned on clean completion; slashed to employer on dispute.
 *  - Either party can raise a dispute after payment release (within 3 days).
 *  - Contract owner acts as arbitrator: can rule in favour of employer (slash)
 *    or freelancer (return stake).
 *  - Reputation score tracked per address: increments on clean close,
 *    decrements on lost dispute.
 */
contract BlindSkillAuction {

    // ─────────────────────────────────────────────
    //  Enums
    // ─────────────────────────────────────────────

    enum AuctionState  { Open, Matched, Revealed, Closed, Disputed }
    enum DisputeResult { Pending, FreelancerWon, EmployerWon }

    // ─────────────────────────────────────────────
    //  Structs
    // ─────────────────────────────────────────────

    struct FreelancerProfile {
        bytes32 commitHash;
        string  encryptedSkills;
        uint256 minBidWei;
        uint256 stakeWei;          // locked ETH bond
        address freelancer;
        bool    exists;
        bool    revealed;
        string  revealedName;
    }

    struct Bid {
        address employer;
        uint256 amount;
        string  jobDescription;
        bool    withdrawn;
        bool    matched;
    }

    struct Dispute {
        address  raisedBy;
        string   reason;
        uint256  raisedAt;
        DisputeResult result;
    }

    struct Auction {
        uint256      profileId;
        AuctionState state;
        uint256      deadline;
        uint256      highestBidId;
        uint256      bidCount;
        uint256      closedAt;       // timestamp when payment released
        Dispute      dispute;
        mapping(uint256 => Bid) bids;
    }

    // ─────────────────────────────────────────────
    //  State
    // ─────────────────────────────────────────────

    uint256 public profileCount;
    uint256 public auctionCount;

    uint256 public constant PLATFORM_FEE_BPS  = 200;  // 2%
    uint256 public constant STAKE_BPS         = 1000; // 10% of minBid
    uint256 public constant DISPUTE_WINDOW    = 3 days;

    address public owner;

    mapping(uint256  => FreelancerProfile) public profiles;
    mapping(uint256  => Auction)           public auctions;
    mapping(address  => uint256[])         public freelancerProfiles;
    mapping(address  => uint256[])         public employerBids;
    mapping(address  => int256)            public reputation; // can go negative

    // ─────────────────────────────────────────────
    //  Events
    // ─────────────────────────────────────────────

    event ProfileCommitted  (uint256 indexed profileId,  address indexed freelancer, string skills, uint256 stake);
    event AuctionCreated    (uint256 indexed auctionId,  uint256 indexed profileId,  uint256 deadline);
    event BidPlaced         (uint256 indexed auctionId,  uint256 indexed bidId,      address indexed employer, uint256 amount);
    event BidWithdrawn      (uint256 indexed auctionId,  uint256 indexed bidId,      address employer);
    event AuctionMatched    (uint256 indexed auctionId,  uint256 indexed bidId,      address employer);
    event IdentityRevealed  (uint256 indexed profileId,  address indexed freelancer, string name);
    event PaymentReleased   (uint256 indexed auctionId,  address freelancer,         uint256 amount);
    event StakeReturned     (uint256 indexed profileId,  address freelancer,         uint256 amount);
    event DisputeRaised     (uint256 indexed auctionId,  address raisedBy,           string reason);
    event DisputeResolved   (uint256 indexed auctionId,  DisputeResult result,       address penalised);
    event ReputationUpdated (address indexed user,       int256 newScore);

    // ─────────────────────────────────────────────
    //  Modifiers
    // ─────────────────────────────────────────────

    modifier onlyOwner()                    { require(msg.sender == owner, "Not owner"); _; }
    modifier profileExists(uint256 pid)     { require(profiles[pid].exists, "Profile not found"); _; }
    modifier auctionOpen(uint256 aid) {
        require(auctions[aid].state == AuctionState.Open, "Auction not open");
        require(block.timestamp < auctions[aid].deadline,  "Auction expired");
        _;
    }

    // ─────────────────────────────────────────────
    //  Constructor
    // ─────────────────────────────────────────────

    constructor() { owner = msg.sender; }

    // ─────────────────────────────────────────────
    //  Freelancer — Commit
    // ─────────────────────────────────────────────

    /**
     * @notice Post a blind profile with a reputation stake.
     * @dev    msg.value must equal (minBidWei * STAKE_BPS / 10000).
     *         The stake is held until the auction closes cleanly or a dispute resolves.
     */
    function commitProfile(
        bytes32        commitHash,
        string calldata encryptedSkills,
        uint256        minBidWei
    ) external payable returns (uint256 profileId) {
        require(commitHash  != bytes32(0), "Invalid hash");
        require(minBidWei   > 0,           "Bid floor must be > 0");

        uint256 stakeAmount = (minBidWei * STAKE_BPS) / 10000;
        require(msg.value == stakeAmount, "Incorrect stake amount");

        profileId = ++profileCount;
        profiles[profileId] = FreelancerProfile({
            commitHash:      commitHash,
            encryptedSkills: encryptedSkills,
            minBidWei:       minBidWei,
            stakeWei:        stakeAmount,
            freelancer:      msg.sender,
            exists:          true,
            revealed:        false,
            revealedName:    ""
        });

        freelancerProfiles[msg.sender].push(profileId);
        _createAuction(profileId, block.timestamp + 7 days);

        emit ProfileCommitted(profileId, msg.sender, encryptedSkills, stakeAmount);
    }

    /**
     * @notice Helper — returns the exact stake required for a given minBid.
     *         Call this from the frontend before commitProfile to show the user
     *         how much ETH to send as msg.value.
     */
    function requiredStake(uint256 minBidWei) external pure returns (uint256) {
        return (minBidWei * STAKE_BPS) / 10000;
    }

    // ─────────────────────────────────────────────
    //  Freelancer — Reveal
    // ─────────────────────────────────────────────

    function revealIdentity(
        uint256         profileId,
        string calldata realName,
        string calldata salt,
        string calldata contactEmail
    ) external profileExists(profileId) {
        FreelancerProfile storage p = profiles[profileId];
        require(msg.sender == p.freelancer, "Not your profile");
        require(!p.revealed,                "Already revealed");

        uint256 auctionId = _getAuctionByProfile(profileId);
        require(auctions[auctionId].state == AuctionState.Matched, "No match yet");

        bytes32 checkHash = keccak256(abi.encodePacked(realName, salt, contactEmail));
        require(checkHash == p.commitHash, "Hash mismatch: data tampered");

        p.revealed      = true;
        p.revealedName  = realName;
        auctions[auctionId].state = AuctionState.Revealed;

        emit IdentityRevealed(profileId, msg.sender, realName);
    }

    // ─────────────────────────────────────────────
    //  Employer — Bid
    // ─────────────────────────────────────────────

    function placeBid(
        uint256         auctionId,
        string calldata jobDescription
    ) external payable auctionOpen(auctionId) {
        FreelancerProfile storage p = profiles[auctions[auctionId].profileId];
        require(msg.value   >= p.minBidWei,   "Bid below floor");
        require(msg.sender  != p.freelancer,  "Cannot bid on own profile");

        Auction storage a  = auctions[auctionId];
        uint256 bidId      = ++a.bidCount;
        a.bids[bidId]      = Bid({
            employer:       msg.sender,
            amount:         msg.value,
            jobDescription: jobDescription,
            withdrawn:      false,
            matched:        false
        });

        if (msg.value > a.bids[a.highestBidId].amount) {
            a.highestBidId = bidId;
        }

        employerBids[msg.sender].push(auctionId);
        emit BidPlaced(auctionId, bidId, msg.sender, msg.value);
    }

    function withdrawBid(uint256 auctionId, uint256 bidId) external {
        Auction storage a = auctions[auctionId];
        Bid     storage b = a.bids[bidId];
        require(b.employer   == msg.sender, "Not your bid");
        require(!b.withdrawn,               "Already withdrawn");
        require(bidId != a.highestBidId || a.state != AuctionState.Open, "Active highest bid");

        b.withdrawn = true;
        payable(msg.sender).transfer(b.amount);
        emit BidWithdrawn(auctionId, bidId, msg.sender);
    }

    // ─────────────────────────────────────────────
    //  Freelancer — Accept
    // ─────────────────────────────────────────────

    function acceptBid(uint256 auctionId, uint256 bidId) external {
        Auction storage a = auctions[auctionId];
        require(msg.sender == profiles[a.profileId].freelancer, "Not your auction");
        require(a.state    == AuctionState.Open,                "Auction not open");
        require(!a.bids[bidId].withdrawn,                       "Bid was withdrawn");

        a.state                  = AuctionState.Matched;
        a.bids[bidId].matched    = true;
        a.highestBidId           = bidId;

        emit AuctionMatched(auctionId, bidId, a.bids[bidId].employer);
    }

    // ─────────────────────────────────────────────
    //  Employer — Release Payment
    // ─────────────────────────────────────────────

    /**
     * @notice Release escrowed ETH to the freelancer.
     *         Stake is NOT returned here — it remains locked for the dispute window.
     *         Call returnStake() after 3 days if no dispute is raised.
     */
    function releasePayment(uint256 auctionId) external {
        Auction storage a = auctions[auctionId];
        require(a.state  == AuctionState.Revealed, "Identity not yet revealed");

        Bid storage win = a.bids[a.highestBidId];
        require(msg.sender == win.employer, "Not the winning employer");

        a.state    = AuctionState.Closed;
        a.closedAt = block.timestamp;

        uint256 fee    = (win.amount * PLATFORM_FEE_BPS) / 10000;
        uint256 payout = win.amount - fee;

        payable(profiles[a.profileId].freelancer).transfer(payout);
        payable(owner).transfer(fee);

        // Reputation +1 for both parties on clean payment
        _addReputation(profiles[a.profileId].freelancer, 1);
        _addReputation(win.employer, 1);

        emit PaymentReleased(auctionId, profiles[a.profileId].freelancer, payout);
    }

    // ─────────────────────────────────────────────
    //  Stake Return (after dispute window)
    // ─────────────────────────────────────────────

    /**
     * @notice Freelancer reclaims their stake after the 3-day dispute window passes.
     *         Only callable if no dispute was raised.
     */
    function returnStake(uint256 auctionId) external {
        Auction storage a = auctions[auctionId];
        FreelancerProfile storage p = profiles[a.profileId];

        require(msg.sender      == p.freelancer,         "Not your auction");
        require(a.state         == AuctionState.Closed,  "Not closed");
        require(a.dispute.raisedBy == address(0),        "Dispute was raised");
        require(block.timestamp >= a.closedAt + DISPUTE_WINDOW, "Dispute window open");

        uint256 stake    = p.stakeWei;
        p.stakeWei       = 0;
        payable(p.freelancer).transfer(stake);

        emit StakeReturned(a.profileId, p.freelancer, stake);
    }

    // ─────────────────────────────────────────────
    //  Dispute System
    // ─────────────────────────────────────────────

    /**
     * @notice Employer raises a dispute within 3 days of payment release.
     *         Freezes the freelancer's stake pending arbitration.
     */
    function raiseDispute(uint256 auctionId, string calldata reason) external {
        Auction storage a   = auctions[auctionId];
        Bid     storage win = a.bids[a.highestBidId];

        require(msg.sender       == win.employer,          "Not the employer");
        require(a.state          == AuctionState.Closed,   "Not closed");
        require(a.dispute.raisedBy == address(0),          "Dispute already raised");
        require(block.timestamp  <= a.closedAt + DISPUTE_WINDOW, "Dispute window closed");

        a.state           = AuctionState.Disputed;
        a.dispute.raisedBy = msg.sender;
        a.dispute.reason   = reason;
        a.dispute.raisedAt = block.timestamp;
        a.dispute.result   = DisputeResult.Pending;

        emit DisputeRaised(auctionId, msg.sender, reason);
    }

    /**
     * @notice Arbitrator (contract owner) resolves the dispute.
     * @param employerWins  true  → slash freelancer stake to employer
     *                      false → return stake to freelancer, reputation penalty to employer
     */
    function resolveDispute(uint256 auctionId, bool employerWins) external onlyOwner {
        Auction storage a = auctions[auctionId];
        require(a.state == AuctionState.Disputed, "No active dispute");

        FreelancerProfile storage p = profiles[a.profileId];
        Bid storage win             = a.bids[a.highestBidId];

        uint256 stake = p.stakeWei;
        p.stakeWei    = 0;
        a.state       = AuctionState.Closed;

        if (employerWins) {
            // Freelancer failed to deliver — stake goes to employer
            a.dispute.result = DisputeResult.EmployerWon;
            payable(win.employer).transfer(stake);
            _addReputation(p.freelancer, -2);
            emit DisputeResolved(auctionId, DisputeResult.EmployerWon, p.freelancer);
        } else {
            // Dispute was unfounded — return stake, penalise employer
            a.dispute.result = DisputeResult.FreelancerWon;
            payable(p.freelancer).transfer(stake);
            _addReputation(win.employer, -1);
            emit DisputeResolved(auctionId, DisputeResult.FreelancerWon, win.employer);
        }
    }

    // ─────────────────────────────────────────────
    //  View Functions
    // ─────────────────────────────────────────────

    function getBid(uint256 auctionId, uint256 bidId)
        external view
        returns (address employer, uint256 amount, string memory jobDescription, bool withdrawn, bool matched)
    {
        Bid storage b = auctions[auctionId].bids[bidId];
        return (b.employer, b.amount, b.jobDescription, b.withdrawn, b.matched);
    }

    function getDispute(uint256 auctionId)
        external view
        returns (address raisedBy, string memory reason, uint256 raisedAt, DisputeResult result)
    {
        Dispute storage d = auctions[auctionId].dispute;
        return (d.raisedBy, d.reason, d.raisedAt, d.result);
    }

    function getFreelancerProfiles(address freelancer) external view returns (uint256[] memory) {
        return freelancerProfiles[freelancer];
    }

    function getReputation(address user) external view returns (int256) {
        return reputation[user];
    }

    function generateCommitHash(string calldata name, string calldata salt, string calldata email)
        external pure returns (bytes32)
    {
        return keccak256(abi.encodePacked(name, salt, email));
    }

    function canReturnStake(uint256 auctionId) external view returns (bool) {
        Auction storage a = auctions[auctionId];
        return (
            a.state == AuctionState.Closed &&
            a.dispute.raisedBy == address(0) &&
            block.timestamp >= a.closedAt + DISPUTE_WINDOW
        );
    }

    // ─────────────────────────────────────────────
    //  Internal
    // ─────────────────────────────────────────────

    function _createAuction(uint256 profileId, uint256 deadline) internal {
        uint256 auctionId              = ++auctionCount;
        auctions[auctionId].profileId  = profileId;
        auctions[auctionId].state      = AuctionState.Open;
        auctions[auctionId].deadline   = deadline;
        emit AuctionCreated(auctionId, profileId, deadline);
    }

    function _getAuctionByProfile(uint256 profileId) internal view returns (uint256) {
        for (uint256 i = 1; i <= auctionCount; i++) {
            if (auctions[i].profileId == profileId) return i;
        }
        revert("Auction not found");
    }

    function _addReputation(address user, int256 delta) internal {
        reputation[user] += delta;
        emit ReputationUpdated(user, reputation[user]);
    }
}
