// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title AccessControlContract
 * @dev Manages which doctor addresses may access each patient's records.
 *      Each patient has a registered "owner" address that is the only
 *      account allowed to grant or revoke access.
 */
contract AccessControlContract {

    // ----------------------------------------------------------
    // State
    // ----------------------------------------------------------

    // patientId => owner wallet address (set once on registration)
    mapping(uint256 => address) private patientOwner;

    // patientId => doctorAddress => hasAccess
    mapping(uint256 => mapping(address => bool)) private accessMap;

    // ----------------------------------------------------------
    // Events
    // ----------------------------------------------------------

    event AccessGranted(
        uint256 indexed patientId,
        address indexed doctorAddress,
        uint256 timestamp
    );

    event AccessRevoked(
        uint256 indexed patientId,
        address indexed doctorAddress,
        uint256 timestamp
    );

    event PatientRegistered(
        uint256 indexed patientId,
        address indexed ownerAddress,
        uint256 timestamp
    );

    // ----------------------------------------------------------
    // Modifiers
    // ----------------------------------------------------------

    modifier onlyPatientOwner(uint256 patientId) {
        require(
            patientOwner[patientId] == msg.sender,
            "AccessControl: caller is not the patient owner"
        );
        _;
    }

    // ----------------------------------------------------------
    // Functions
    // ----------------------------------------------------------

    /**
     * @notice Register a wallet address as the owner of a patient record.
     *         Can only be called once per patientId.
     * @param patientId     Numeric patient ID from the SQL database.
     * @param ownerAddress  Patient's Ethereum wallet address.
     */
    function registerPatient(uint256 patientId, address ownerAddress) external {
        require(
            patientOwner[patientId] == address(0),
            "AccessControl: patient already registered"
        );
        patientOwner[patientId] = ownerAddress;
        emit PatientRegistered(patientId, ownerAddress, block.timestamp);
    }

    /**
     * @notice Grant a doctor access to a patient's records.
     *         Only the patient's registered address can call this.
     * @param patientId     Numeric patient ID.
     * @param doctorAddress Doctor's Ethereum wallet address.
     */
    function grantAccess(uint256 patientId, address doctorAddress)
        external
        onlyPatientOwner(patientId)
    {
        require(doctorAddress != address(0), "AccessControl: zero address");
        accessMap[patientId][doctorAddress] = true;
        emit AccessGranted(patientId, doctorAddress, block.timestamp);
    }

    /**
     * @notice Revoke a doctor's access to a patient's records.
     *         Only the patient's registered address can call this.
     * @param patientId     Numeric patient ID.
     * @param doctorAddress Doctor's Ethereum wallet address.
     */
    function revokeAccess(uint256 patientId, address doctorAddress)
        external
        onlyPatientOwner(patientId)
    {
        accessMap[patientId][doctorAddress] = false;
        emit AccessRevoked(patientId, doctorAddress, block.timestamp);
    }

    /**
     * @notice Check whether a doctor currently has access to a patient's records.
     * @param patientId     Numeric patient ID.
     * @param doctorAddress Doctor's Ethereum wallet address.
     * @return true if access is granted, false otherwise.
     */
    function hasAccess(uint256 patientId, address doctorAddress)
        external
        view
        returns (bool)
    {
        return accessMap[patientId][doctorAddress];
    }

    /**
     * @notice Get the owner address registered for a patient.
     * @param patientId  Numeric patient ID.
     */
    function getPatientOwner(uint256 patientId) external view returns (address) {
        return patientOwner[patientId];
    }
}
