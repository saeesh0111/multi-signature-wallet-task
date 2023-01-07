const { AlchemyWebSocketProvider } = require("@ethersproject/providers");
const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

describe("MultiSgiWallet deploy", function () {
  let multiSigWalletFactory;
  beforeEach(async function () {
    multiSigWalletFactory = await ethers.getContractFactory("MultiSigWallet");
  });

  it("Should initialize correctly", async function () {
    const accounts = await ethers.getSigners();
    const owner_count = 3;
    const approvals = 2;
    let owners = accounts.slice(0, owner_count).map((a) => a.address);

    const msw = await multiSigWalletFactory.deploy(owners, approvals);
    await msw.deployed();

    expect(await msw.requiredApprovals()).to.equal(approvals);

    for (let i = 0; i < owners.length; ++i) {
      expect(await msw.owners(i)).to.equal(owners[i]);
      expect(await msw.isOwner(owners[i])).to.equal(true);
    }
  });

  it("Should fail for non-unique owners", async function () {
    const accounts = await ethers.getSigners();
    const owner_count = 3;
    const approvals = 2;
    let owners = [];
    owners.push(accounts[0].address);
    owners.push(accounts[1].address);
    owners.push(accounts[0].address); // already exists

    await expect(
      multiSigWalletFactory.deploy(owners, approvals)
    ).to.be.revertedWith("owners must be unique");
  });

  it("Should fail for invalid required approvals", async function () {
    const accounts = await ethers.getSigners();
    const owner_count = 3;
    const approvals = 4;
    let owners = accounts.slice(0, owner_count).map((a) => a.address);
    await expect(multiSigWalletFactory.deploy(owners, approvals)).to.be
      .reverted;
  });
});

describe("MultiSgiWallet 2 out of 3", function () {
  let multiSigWalletFactory;
  let msw;
  let owners;
  const owner_count = 3;
  const approvals = 2;
  let deployer;
  let accounts;

  beforeEach(async function () {
    multiSigWalletFactory = await ethers.getContractFactory("MultiSigWallet");

    accounts = await ethers.getSigners();
    deployer = accounts[0].address;
    owners = accounts.slice(0, owner_count).map((a) => a.address);
    msw = await multiSigWalletFactory.deploy(owners, approvals);
    await msw.deployed();
  });

  it("Should add tx when submit", async function () {
    let to = owners[1];
    let value = ethers.utils.parseEther("0.1");
    let data = [];
    await msw.submit(to, value, data);

    const tx = await msw.transactions(0);
    expect(tx.to).to.equal(to);
    expect(tx.value).to.equal(value);
    assert(ethers.utils.isHexString(tx.data, 0));
    assert(!tx.executed);
  });

  it("Should add approval when tx approved", async function () {
    let to = owners[1];
    let value = ethers.utils.parseEther("0.1");
    let data = [];

    let txId = 0;
    await expect(msw.submit(to, value, data))
      .to.emit(msw, "Submit")
      .withArgs(deployer, txId);

    let approved = await msw.approved(txId, deployer);
    assert(!approved);

    await expect(msw.approve(txId))
      .to.emit(msw, "Approve")
      .withArgs(deployer, txId);

    approved = await msw.approved(txId, deployer);
    assert(approved);
  });

  it("Should execute a transfer when have enough approvals", async function () {
    let to = owners[1];
    let value = ethers.utils.parseEther("0.001");
    let data = [];

    // send some eth to the contract
    await accounts[0].sendTransaction({
      to: msw.address,
      value: ethers.utils.parseEther("1"),
    });

    let txId = 0;
    await expect(msw.submit(to, value, data))
      .to.emit(msw, "Submit")
      .withArgs(deployer, txId);

    await expect(msw.approve(txId))
      .to.emit(msw, "Approve")
      .withArgs(deployer, txId);

    await expect(msw.connect(accounts[1]).approve(txId))
      .to.emit(msw, "Approve")
      .withArgs(owners[1], txId);

    await expect(msw.execute(txId)).to.emit(msw, "Execute").withArgs(txId);
  });

  it("Should execute a contract call when have enough approvals", async function () {
    testContractFactory = await ethers.getContractFactory("TestContract");
    testContract = await testContractFactory.deploy();
    await testContract.deployed();

    let to = testContract.address;
    let value = 0;
    let data = await testContract.getData();

    let txId = 0;
    await expect(msw.submit(to, value, data))
      .to.emit(msw, "Submit")
      .withArgs(deployer, txId);

    await expect(msw.approve(txId))
      .to.emit(msw, "Approve")
      .withArgs(deployer, txId);

    await expect(msw.connect(accounts[1]).approve(txId))
      .to.emit(msw, "Approve")
      .withArgs(owners[1], txId);

    await expect(msw.execute(txId)).to.emit(msw, "Execute").withArgs(txId);
  });

  it("Should remove approval when tx revoked", async function () {
    let to = owners[1];
    let value = ethers.utils.parseEther("0.1");
    let data = [];

    let txId = 0;
    await expect(msw.submit(to, value, data))
      .to.emit(msw, "Submit")
      .withArgs(deployer, txId);

    let approved = await msw.approved(txId, deployer);
    assert(!approved);

    await expect(msw.approve(txId))
      .to.emit(msw, "Approve")
      .withArgs(deployer, txId);

    approved = await msw.approved(txId, deployer);
    assert(approved);

    await expect(msw.revoke(txId))
      .to.emit(msw, "Revoke")
      .withArgs(deployer, txId);

    approved = await msw.approved(txId, deployer);
    assert(!approved);
  });
});
