// backend/src/config/blockchain.js
const { ethers } = require("ethers");
const fs         = require("fs");
const path       = require("path");


// ── Provider & Wallet ────────────────────────────────────────
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
const wallet   = new ethers.Wallet("0x62aefa57ac692730760e77e1a550c3c22bb66b8a174dd55eb363b8d9b916a3ea", provider);

// ── Deployed addresses ───────────────────────────────────────
const addressesPath = path.join(
  __dirname,
  "../../../blockchain/deployed-addresses.json"
);
const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

// ── ABIs (from Hardhat artifacts) ────────────────────────────
function loadABI(contractName) {
  const artifactPath = path.join(
    __dirname,
    `../../../blockchain/artifacts/contracts/${contractName}.sol/${contractName}.json`
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  return artifact.abi;
}

const patientRecordABI   = loadABI("PatientRecordContract");
const accessControlABI   = loadABI("AccessControlContract");
const auditLogABI        = loadABI("AuditLogContract");

// ── Contract instances ───────────────────────────────────────
const patientRecordContract = new ethers.Contract(
  addresses.PatientRecordContract,
  patientRecordABI,
  wallet
);

const accessContract = new ethers.Contract(
  addresses.AccessControlContract,
  accessControlABI,
  wallet
);

const auditContract = new ethers.Contract(
  addresses.AuditLogContract,
  auditLogABI,
  wallet
);

// ── Startup check ────────────────────────────────────────────
provider.getBlockNumber()
  .then((block) => console.log(`✅ Blockchain connected — block #${block}`))
  .catch((err)  => console.error("❌ Blockchain connection failed:", err.message));

module.exports = { provider, wallet, patientRecordContract, accessContract, auditContract };