// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title PatientRecordContract
 * @dev Stores SHA-256 hashes of medical records on-chain.
 *      Only authorised callers (the backend wallet) can add records.
 */
contract PatientRecordContract {

    // ----------------------------------------------------------
    // Data structures
    // ----------------------------------------------------------

    struct Record {
        string  dataHash;       // SHA-256 hex of the JSON record
        address updatedBy;      // Wallet address that wrote the record
        uint256 timestamp;      // Block timestamp
    }

    // patientId (uint256) => list of record snapshots
    mapping(uint256 => Record[]) private records;

    // ----------------------------------------------------------
    // Events
    // ----------------------------------------------------------

    event RecordAdded(
        uint256 indexed patientId,
        string  dataHash,
        address indexed updatedBy,
        uint256 timestamp
    );

    // ----------------------------------------------------------
    // Functions
    // ----------------------------------------------------------

    /**
     * @notice Add a new record hash for a patient.
     * @param patientId  Numeric patient ID from the SQL database.
     * @param dataHash   SHA-256 hex string of the record JSON.
     */
    function addRecord(uint256 patientId, string calldata dataHash) external {
        records[patientId].push(Record({
            dataHash:  dataHash,
            updatedBy: msg.sender,
            timestamp: block.timestamp
        }));

        emit RecordAdded(patientId, dataHash, msg.sender, block.timestamp);
    }

    /**
     * @notice Return the full history of record hashes for a patient.
     * @param patientId  Numeric patient ID.
     * @return Array of Record structs.
     */
    function getHistory(uint256 patientId)
        external
        view
        returns (Record[] memory)
    {
        return records[patientId];
    }

    /**
     * @notice Verify whether a given hash exists in the patient's history.
     * @param patientId  Numeric patient ID.
     * @param dataHash   SHA-256 hex string to search for.
     * @return true if found, false otherwise.
     */
    function verifyRecord(uint256 patientId, string calldata dataHash)
        external
        view
        returns (bool)
    {
        Record[] storage history = records[patientId];
        for (uint256 i = 0; i < history.length; i++) {
            if (keccak256(bytes(history[i].dataHash)) == keccak256(bytes(dataHash))) {
                return true;
            }
        }
        return false;
    }

    /**
     * @notice Get the total number of records stored for a patient.
     * @param patientId  Numeric patient ID.
     */
    function getRecordCount(uint256 patientId) external view returns (uint256) {
        return records[patientId].length;
    }
}
