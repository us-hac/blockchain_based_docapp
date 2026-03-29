// backend/src/services/blockchainService.js
const { ethers }                                              = require("ethers");
const { patientRecordContract, accessContract, auditContract } = require("../config/blockchain");

/**
 * Compute SHA-256 hash of a record object.
 * @param {object} recordData  Plain JS object of the record row.
 * @returns {string}           64-char hex string (no 0x prefix).
 */
function hashRecord(recordData) {
  const json      = JSON.stringify(recordData);
  const bytes     = ethers.toUtf8Bytes(json);
  const hash      = ethers.sha256(bytes);        // returns 0x + 64 hex chars
  return hash.slice(2);                          // strip 0x → 64 hex chars
}

/**
 * Write a record hash to the PatientRecordContract on-chain.
 * @param {number} patientId   Numeric patient ID.
 * @param {string} dataHash    64-char hex hash from hashRecord().
 * @returns {string}           Ethereum transaction hash (tx.hash).
 */
async function writeRecordHash(patientId, dataHash) {
  const tx = await patientRecordContract.addRecord(patientId, dataHash);
  await tx.wait();                               // wait for block confirmation
  console.log(`⛓  Record hash written — tx: ${tx.hash}`);
  return tx.hash;
}

/**
 * Verify whether a hash exists on-chain for a given patient.
 * @param {number} patientId   Numeric patient ID.
 * @param {string} dataHash    64-char hex hash to verify.
 * @returns {boolean}          true if found, false if tampered/missing.
 */
async function verifyRecordHash(patientId, dataHash) {
  const result = await patientRecordContract.verifyRecord(patientId, dataHash);
  return result;
}

/**
 * Log an action to the AuditLogContract on-chain.
 * @param {number} patientId     Numeric patient ID.
 * @param {string} userAddress   Ethereum address of the actor.
 * @param {string} action        Action string e.g. "ADD_RECORD", "VIEW_RECORD".
 * @returns {string}             Ethereum transaction hash.
 */
async function logAction(patientId, userAddress, action) {
  const tx = await auditContract.logAction(patientId, userAddress, action);
  await tx.wait();
  console.log(`📋 Audit logged [${action}] — tx: ${tx.hash}`);
  return tx.hash;
}

/**
 * Grant a doctor access to a patient's records on-chain.
 * @param {number} patientId      Numeric patient ID.
 * @param {string} doctorAddress  Doctor's Ethereum wallet address.
 * @returns {string}              Ethereum transaction hash.
 */
async function grantAccess(patientId, doctorAddress) {
  const tx = await accessContract.grantAccess(patientId, doctorAddress);
  await tx.wait();
  console.log(`🔓 Access granted — tx: ${tx.hash}`);
  return tx.hash;
}

/**
 * Revoke a doctor's access to a patient's records on-chain.
 * @param {number} patientId      Numeric patient ID.
 * @param {string} doctorAddress  Doctor's Ethereum wallet address.
 * @returns {string}              Ethereum transaction hash.
 */
async function revokeAccess(patientId, doctorAddress) {
  const tx = await accessContract.revokeAccess(patientId, doctorAddress);
  await tx.wait();
  console.log(`🔒 Access revoked — tx: ${tx.hash}`);
  return tx.hash;
}

module.exports = { hashRecord, writeRecordHash, verifyRecordHash, logAction, grantAccess, revokeAccess };
