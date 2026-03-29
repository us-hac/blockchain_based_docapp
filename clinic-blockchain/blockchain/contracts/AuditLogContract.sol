// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title AuditLogContract
 * @dev Immutable audit trail for all actions performed in the clinic system.
 *      Every write appends a new log entry — nothing can be deleted or modified.
 */
contract AuditLogContract {

    // ----------------------------------------------------------
    // Data structures
    // ----------------------------------------------------------

    struct Log {
        uint256 patientId;      // Patient whose data was touched
        address callerAddress;  // Backend wallet / user wallet that triggered the action
        string  action;         // Human-readable action: VIEW_RECORD, ADD_RECORD, etc.
        uint256 timestamp;      // Block timestamp
    }

    // patientId => array of log entries
    mapping(uint256 => Log[]) private auditLogs;

    // ----------------------------------------------------------
    // Events
    // ----------------------------------------------------------

    event ActionLogged(
        uint256 indexed patientId,
        address indexed callerAddress,
        string  action,
        uint256 timestamp
    );

    // ----------------------------------------------------------
    // Functions
    // ----------------------------------------------------------

    /**
     * @notice Record an action related to a patient.
     * @param patientId     Numeric patient ID from the SQL database.
     * @param callerAddress Ethereum address of the actor (doctor, patient, admin).
     * @param action        Short string describing the action (e.g. "ADD_RECORD").
     */
    function logAction(
        uint256       patientId,
        address       callerAddress,
        string calldata action
    ) external {
        auditLogs[patientId].push(Log({
            patientId:     patientId,
            callerAddress: callerAddress,
            action:        action,
            timestamp:     block.timestamp
        }));

        emit ActionLogged(patientId, callerAddress, action, block.timestamp);
    }

    /**
     * @notice Retrieve the full audit trail for a patient.
     * @param patientId  Numeric patient ID.
     * @return Array of Log structs in chronological order.
     */
    function getLogs(uint256 patientId)
        external
        view
        returns (Log[] memory)
    {
        return auditLogs[patientId];
    }

    /**
     * @notice Get the total number of log entries for a patient.
     * @param patientId  Numeric patient ID.
     */
    function getLogCount(uint256 patientId) external view returns (uint256) {
        return auditLogs[patientId].length;
    }
}
