// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title  MercaKYC
 * @notice On-chain KYC allowlist for MERCA (Process 1 of DFD).
 *         Off-chain KYC provider verifies identity → owner whitelists address on-chain.
 *         MercaInvoice and MercaWallet check this contract before allowing actions.
 *
 * Flow:
 *   User completes KYC off-chain (via KYC provider)
 *   Owner/operator calls verifyAddress() → address is whitelisted
 *   MercaInvoice checks isVerified() before createInvoice()
 */
contract MercaKYC is Ownable, Pausable {

    // ─── Types ────────────────────────────────────────────────────────────────

    enum KYCLevel {
        None,       // 0 - not verified
        Basic,      // 1 - email + phone verified (customer)
        Full        // 2 - full ID verified (merchant/SME)
    }

    struct KYCRecord {
        KYCLevel level;
        uint256  verifiedAt;
        uint256  expiresAt;   // 0 = never expires
        bool     suspended;
    }

    // ─── State ────────────────────────────────────────────────────────────────

    mapping(address => KYCRecord) public records;

    /// operators can verify addresses (e.g. backend wallet)
    mapping(address => bool) public operators;

    // ─── Events ───────────────────────────────────────────────────────────────

    event AddressVerified(address indexed account, KYCLevel level, uint256 expiresAt);
    event AddressRevoked(address indexed account);
    event AddressSuspended(address indexed account, bool suspended);
    event OperatorSet(address indexed operator, bool approved);

    // ─── Errors ───────────────────────────────────────────────────────────────

    error NotOperator();
    error AlreadyVerified(address account);
    error NotVerified(address account);

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOperator() {
        if (!operators[msg.sender] && msg.sender != owner()) revert NotOperator();
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor() Ownable(msg.sender) {
        // deployer is an operator by default
        operators[msg.sender] = true;
    }

    // ─── Operator Functions ───────────────────────────────────────────────────

    /**
     * @notice Verify an address with a KYC level.
     * @param account   Address to verify.
     * @param level     KYCLevel.Basic for customers, KYCLevel.Full for merchants.
     * @param expiresAt Unix timestamp for expiry. 0 = never expires.
     */
    function verifyAddress(
        address account,
        KYCLevel level,
        uint256 expiresAt
    ) external onlyOperator whenNotPaused {
        records[account] = KYCRecord({
            level:      level,
            verifiedAt: block.timestamp,
            expiresAt:  expiresAt,
            suspended:  false
        });
        emit AddressVerified(account, level, expiresAt);
    }

    /**
     * @notice Batch verify multiple addresses at once.
     */
    function verifyBatch(
        address[] calldata accounts,
        KYCLevel level,
        uint256 expiresAt
    ) external onlyOperator whenNotPaused {
        for (uint256 i = 0; i < accounts.length; i++) {
            records[accounts[i]] = KYCRecord({
                level:      level,
                verifiedAt: block.timestamp,
                expiresAt:  expiresAt,
                suspended:  false
            });
            emit AddressVerified(accounts[i], level, expiresAt);
        }
    }

    /**
     * @notice Revoke KYC for an address.
     */
    function revokeAddress(address account) external onlyOperator {
        delete records[account];
        emit AddressRevoked(account);
    }

    /**
     * @notice Suspend/unsuspend an address without removing KYC record.
     */
    function setSuspended(address account, bool suspended) external onlyOperator {
        records[account].suspended = suspended;
        emit AddressSuspended(account, suspended);
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    /**
     * @notice Check if address has at least Basic KYC and is not suspended/expired.
     */
    function isVerified(address account) external view returns (bool) {
        return _isVerifiedAtLevel(account, KYCLevel.Basic);
    }

    /**
     * @notice Check if address has Full KYC (required for merchants).
     */
    function isMerchantVerified(address account) external view returns (bool) {
        return _isVerifiedAtLevel(account, KYCLevel.Full);
    }

    /**
     * @notice Get the KYC level of an address.
     */
    function getLevel(address account) external view returns (KYCLevel) {
        KYCRecord storage r = records[account];
        if (r.level == KYCLevel.None) return KYCLevel.None;
        if (r.suspended) return KYCLevel.None;
        if (r.expiresAt != 0 && block.timestamp > r.expiresAt) return KYCLevel.None;
        return r.level;
    }

    // ─── Owner Functions ──────────────────────────────────────────────────────

    function setOperator(address operator, bool approved) external onlyOwner {
        operators[operator] = approved;
        emit OperatorSet(operator, approved);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _isVerifiedAtLevel(address account, KYCLevel required) internal view returns (bool) {
        KYCRecord storage r = records[account];
        if (r.level < required) return false;
        if (r.suspended) return false;
        if (r.expiresAt != 0 && block.timestamp > r.expiresAt) return false;
        return true;
    }
}
