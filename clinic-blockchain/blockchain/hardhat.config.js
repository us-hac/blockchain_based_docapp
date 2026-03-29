require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  networks: {
    ganache: {
      url: "http://127.0.0.1:7545",
      accounts: ["0x13339bccbbda5c7d50a7aa4dc7a226e7710aafbf98f981eff6205fa1b9e50562"],
    },
  },
  paths: {
    artifacts: "./artifacts",
    sources:   "./contracts",
    scripts:   "./scripts",
    tests:     "./test",
  },
};