// blockchain/scripts/deploy.js
// ---------------------------------------------------------------
// Deploys all three clinic smart contracts to the configured
// network (Ganache by default) and saves their addresses to
// /blockchain/deployed-addresses.json for the backend to consume.
// ---------------------------------------------------------------
// Usage:
//   npx hardhat run scripts/deploy.js --network ganache
// ---------------------------------------------------------------

const { ethers } = require("hardhat");
const fs   = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("=================================================");
  console.log(" Clinic Blockchain — Contract Deployment");
  console.log("=================================================");
  console.log(`Deployer address : ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer balance : ${ethers.formatEther(balance)} ETH\n`);

  // ---- 1. PatientRecordContract --------------------------------
  console.log("Deploying PatientRecordContract...");
  const PatientRecordFactory = await ethers.getContractFactory("PatientRecordContract");
  const patientRecordContract = await PatientRecordFactory.deploy();
  await patientRecordContract.waitForDeployment();
  const patientRecordAddress = await patientRecordContract.getAddress();
  console.log(`✅ PatientRecordContract : ${patientRecordAddress}`);

  // ---- 2. AccessControlContract --------------------------------
  console.log("Deploying AccessControlContract...");
  const AccessControlFactory = await ethers.getContractFactory("AccessControlContract");
  const accessControlContract = await AccessControlFactory.deploy();
  await accessControlContract.waitForDeployment();
  const accessControlAddress = await accessControlContract.getAddress();
  console.log(`✅ AccessControlContract  : ${accessControlAddress}`);

  // ---- 3. AuditLogContract -------------------------------------
  console.log("Deploying AuditLogContract...");
  const AuditLogFactory = await ethers.getContractFactory("AuditLogContract");
  const auditLogContract = await AuditLogFactory.deploy();
  await auditLogContract.waitForDeployment();
  const auditLogAddress = await auditLogContract.getAddress();
  console.log(`✅ AuditLogContract       : ${auditLogAddress}\n`);

  // ---- Save addresses to JSON ----------------------------------
  const addresses = {
    network:               "ganache",
    deployedAt:            new Date().toISOString(),
    deployerAddress:       deployer.address,
    PatientRecordContract: patientRecordAddress,
    AccessControlContract: accessControlAddress,
    AuditLogContract:      auditLogAddress,
  };

  // Always write relative to the /blockchain directory
  const outputPath = path.join(__dirname, "..", "deployed-addresses.json");
  fs.writeFileSync(outputPath, JSON.stringify(addresses, null, 2));

  console.log("=================================================");
  console.log(` Addresses saved → ${outputPath}`);
  console.log("=================================================");
  console.log(JSON.stringify(addresses, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
