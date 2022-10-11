import { ethers, waffle } from "hardhat";
import { expect } from "chai";
import { Forwarder, RecipientERC20 } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { signMetaTxRequest } from "./functions";
import { TypeOfRequest } from "../src/types/types";

async function deploy(name: string, ...params: any) {
  const Contract = await ethers.getContractFactory(name);
  return await Contract.deploy(...params).then((f) => f.deployed());
}

describe("AutoMeta Transactions Test Cases", async () => {
  let forwarder: Forwarder;
  let recipient: RecipientERC20;
  let accounts: SignerWithAddress[];

  beforeEach(async () => {
    accounts = await ethers.getSigners();

    forwarder = (await deploy("Forwarder", accounts[0].address)) as Forwarder;
    recipient = (await deploy(
      "RecipientERC20",
      forwarder.address
    )) as RecipientERC20;
  });

  it("Transfer function using meta-transactions", async () => {
    const provider = waffle.provider;

    const relayer = accounts[0];

    const signer = provider.getSigner(2);
    const signerAddress = await signer.getAddress();
    await recipient.mint(signerAddress, ethers.utils.parseEther("1"));

    const forwarderConnected = forwarder.connect(relayer);
    const receiver = accounts[4];

    const { request, signature } = await signMetaTxRequest(
      TypeOfRequest.MetaTransfer,
      signer,
      forwarderConnected,
      provider,
      {
        from: signerAddress,
        to: receiver.address,
        tokenAddr: recipient.address,
        amount: ethers.utils.parseEther("1").toString(),
      }
    );

    const signerBalanceBeforeTx = await recipient.balanceOf(signerAddress);
    const receiverBalanceBeforeTx = await recipient.balanceOf(receiver.address);

    await forwarderConnected.executeTransaction([request], [signature]);

    const signerBalanceAfterTx = await recipient.balanceOf(signerAddress);
    const receiverBalanceAfterTx = await recipient.balanceOf(receiver.address);

    expect(signerBalanceBeforeTx).to.equal(ethers.utils.parseEther("1"));
    expect(signerBalanceAfterTx).to.equal(0);
    expect(receiverBalanceBeforeTx).to.equal(0);
    expect(receiverBalanceAfterTx).to.equal(ethers.utils.parseEther("1"));
  });

  it("Approval function using meta-transactions", async () => {
    const provider = waffle.provider;

    const relayer = accounts[0];

    const signer = provider.getSigner(2);
    const signerAddress = await signer.getAddress();
    await recipient.mint(signerAddress, ethers.utils.parseEther("1"));

    const forwarderConnected = forwarder.connect(relayer);
    const receiver = accounts[4];

    const { request, signature } = await signMetaTxRequest(
      TypeOfRequest.MetaApprove,
      signer,
      forwarderConnected,
      provider,
      {
        from: signerAddress,
        to: receiver.address,
        tokenAddr: recipient.address,
        amount: ethers.utils.parseEther("1").toString(),
      }
    );

    const allowanceBeforeTx = await recipient.allowance(
      signerAddress,
      receiver.address
    );

    await forwarderConnected.executeTransaction([request], [signature]);

    const allowanceAfterTx = await recipient.allowance(
      signerAddress,
      receiver.address
    );

    expect(allowanceBeforeTx).to.equal(0);
    expect(allowanceAfterTx).to.equal(ethers.utils.parseEther("1"));
  });

  it("TransferFrom function using meta-transactions", async () => {
    const provider = waffle.provider;

    const relayer = accounts[0];

    const signer = provider.getSigner(2);
    const signerAddress = await signer.getAddress();
    await recipient.mint(signerAddress, ethers.utils.parseEther("1"));

    const forwarderConnected = forwarder.connect(relayer);
    const receiver = provider.getSigner(3);
    const receiverAddress = await receiver.getAddress();

    const { request: allowanceReq, signature: allowanceSign } =
      await signMetaTxRequest(
        TypeOfRequest.MetaApprove,
        signer,
        forwarderConnected,
        provider,
        {
          from: signerAddress,
          to: receiverAddress,
          tokenAddr: recipient.address,
          amount: ethers.utils.parseEther("1").toString(),
        }
      );

    const { request: transferFromReq, signature: transferFromSign } =
      await signMetaTxRequest(
        TypeOfRequest.MetaTransferFrom,
        receiver,
        forwarderConnected,
        provider,
        {
          from: receiverAddress,
          owner: signerAddress,
          to: receiverAddress,
          tokenAddr: recipient.address,
          amount: ethers.utils.parseEther("1").toString(),
        }
      );

    const signerBalanceBeforeTx = await recipient.balanceOf(signerAddress);
    const receiverBalanceBeforeTx = await recipient.balanceOf(receiverAddress);

    await forwarderConnected.executeTransaction(
      [allowanceReq, transferFromReq],
      [allowanceSign, transferFromSign]
    );

    const signerBalanceAfterTx = await recipient.balanceOf(signerAddress);
    const receiverBalanceAfterTx = await recipient.balanceOf(receiverAddress);

    const allowanceAfterTransferFrom = await recipient.allowance(
      signerAddress,
      receiverAddress
    );

    expect(signerBalanceBeforeTx).to.equal(ethers.utils.parseEther("1"));
    expect(signerBalanceAfterTx).to.equal(0);
    expect(receiverBalanceBeforeTx).to.equal(0);
    expect(receiverBalanceAfterTx).to.equal(ethers.utils.parseEther("1"));
    expect(allowanceAfterTransferFrom).to.equal(0);
  });

  it("TransferFrom function using meta-transactions", async () => {
    const provider = waffle.provider;

    const relayer = accounts[0];

    const signer = provider.getSigner(2);
    const signerAddress = await signer.getAddress();
    await recipient.mint(signerAddress, ethers.utils.parseEther("1"));

    const forwarderConnected = forwarder.connect(relayer);
    const receiver = provider.getSigner(3);
    const receiverAddress = await receiver.getAddress();

    const { request: allowanceReq, signature: allowanceSign } =
      await signMetaTxRequest(
        TypeOfRequest.MetaApprove,
        signer,
        forwarderConnected,
        provider,
        {
          from: signerAddress,
          to: receiverAddress,
          tokenAddr: recipient.address,
          amount: ethers.utils.parseEther("1").toString(),
        }
      );

    const allowanceBeforeTx = await recipient.allowance(
      signerAddress,
      receiverAddress
    );

    await forwarderConnected.executeTransaction(
      [allowanceReq],
      [allowanceSign]
    );

    const allowanceAfterTx = await recipient.allowance(
      signerAddress,
      receiverAddress
    );

    expect(allowanceBeforeTx).to.equal(0);
    expect(allowanceAfterTx).to.equal(ethers.utils.parseEther("1"));

    const { request: transferFromReq, signature: transferFromSign } =
      await signMetaTxRequest(
        TypeOfRequest.MetaTransferFrom,
        receiver,
        forwarderConnected,
        provider,
        {
          from: receiverAddress,
          owner: signerAddress,
          to: receiverAddress,
          tokenAddr: recipient.address,
          amount: ethers.utils.parseEther("1").toString(),
        }
      );

    const signerBalanceBeforeTx = await recipient.balanceOf(signerAddress);
    const receiverBalanceBeforeTx = await recipient.balanceOf(receiverAddress);

    await forwarderConnected.executeTransaction(
      [transferFromReq],
      [transferFromSign]
    );

    const signerBalanceAfterTx = await recipient.balanceOf(signerAddress);
    const receiverBalanceAfterTx = await recipient.balanceOf(receiverAddress);

    const allowanceAfterTransferFrom = await recipient.allowance(
      signerAddress,
      receiverAddress
    );

    expect(signerBalanceBeforeTx).to.equal(ethers.utils.parseEther("1"));
    expect(signerBalanceAfterTx).to.equal(0);
    expect(receiverBalanceBeforeTx).to.equal(0);
    expect(receiverBalanceAfterTx).to.equal(ethers.utils.parseEther("1"));
    expect(allowanceAfterTransferFrom).to.equal(0);
  });

  it("multiple transfers using meta-transactions", async () => {
    const provider = waffle.provider;

    const relayer = accounts[0];

    const signer1 = provider.getSigner(2);
    const signer1Address = await signer1.getAddress();

    const signer2 = provider.getSigner(3);
    const signer2Address = await signer2.getAddress();

    await recipient.mint(signer1Address, ethers.utils.parseEther("1"));
    await recipient.mint(signer2Address, ethers.utils.parseEther("1"));

    const forwarderConnected = forwarder.connect(relayer);
    const receiver1 = accounts[4];
    const receiver2 = accounts[5];

    const { request: request1, signature: signature1 } =
      await signMetaTxRequest(
        TypeOfRequest.MetaTransfer,
        signer1,
        forwarderConnected,
        provider,
        {
          from: signer1Address,
          to: receiver1.address,
          tokenAddr: recipient.address,
          amount: ethers.utils.parseEther("1").toString(),
        }
      );

    const { request: request2, signature: signature2 } =
      await signMetaTxRequest(
        TypeOfRequest.MetaTransfer,
        signer2,
        forwarderConnected,
        provider,
        {
          from: signer2Address,
          to: receiver2.address,
          tokenAddr: recipient.address,
          amount: ethers.utils.parseEther("1").toString(),
        }
      );

    const signer1BalanceBeforeTx = await recipient.balanceOf(signer1Address);
    const signer2BalanceBeforeTx = await recipient.balanceOf(signer2Address);
    const receiver1BalanceBeforeTx = await recipient.balanceOf(
      receiver1.address
    );
    const receiver2BalanceBeforeTx = await recipient.balanceOf(
      receiver2.address
    );

    await forwarderConnected.executeTransaction(
      [request1, request2],
      [signature1, signature2]
    );

    const signer1BalanceAfterTx = await recipient.balanceOf(signer1Address);
    const signer2BalanceAfterTx = await recipient.balanceOf(signer2Address);
    const receiver1BalanceAfterTx = await recipient.balanceOf(
      receiver1.address
    );
    const receiver2BalanceAfterTx = await recipient.balanceOf(
      receiver2.address
    );

    expect(signer1BalanceBeforeTx).to.equal(ethers.utils.parseEther("1"));
    expect(signer1BalanceAfterTx).to.equal(0);
    expect(receiver1BalanceBeforeTx).to.equal(0);
    expect(receiver1BalanceAfterTx).to.equal(ethers.utils.parseEther("1"));

    expect(signer2BalanceBeforeTx).to.equal(ethers.utils.parseEther("1"));
    expect(signer2BalanceAfterTx).to.equal(0);
    expect(receiver2BalanceBeforeTx).to.equal(0);
    expect(receiver2BalanceAfterTx).to.equal(ethers.utils.parseEther("1"));
  });

  it("Does not transfer tokens if someone tries to transact for other signer without allowance", async () => {
    const provider = waffle.provider;

    const relayer = accounts[0];

    const signer = provider.getSigner(2);
    const signerAddress = await signer.getAddress();
    await recipient.mint(signerAddress, ethers.utils.parseEther("1"));

    const forwarderConnected = forwarder.connect(relayer);
    const receiver = accounts[4];

    const { request, signature } = await signMetaTxRequest(
      TypeOfRequest.MetaTransferFrom,
      signer,
      forwarderConnected,
      provider,
      {
        // Here accounts[5] is trying to transact for signer
        from: accounts[5].address,
        owner: signerAddress,
        to: receiver.address,
        tokenAddr: recipient.address,
        amount: ethers.utils.parseEther("1").toString(),
      }
    );

    const signerBalanceBeforeTx = await recipient.balanceOf(signerAddress);
    const receiverBalanceBeforeTx = await recipient.balanceOf(receiver.address);

    await forwarderConnected.executeTransaction([request], [signature]);

    const signerBalanceAfterTx = await recipient.balanceOf(signerAddress);
    const receiverBalanceAfterTx = await recipient.balanceOf(receiver.address);

    expect(signerBalanceBeforeTx).to.equal(signerBalanceAfterTx);
    expect(receiverBalanceBeforeTx).to.equal(receiverBalanceAfterTx);
  });

  it("Does not transfer tokens if signer's balance is lower than requested", async () => {
    const provider = waffle.provider;

    const relayer = accounts[0];

    const signer = provider.getSigner(2);
    const signerAddress = await signer.getAddress();
    await recipient.mint(signerAddress, ethers.utils.parseEther("1"));

    const forwarderConnected = forwarder.connect(relayer);
    const receiver = accounts[4];

    const { request, signature } = await signMetaTxRequest(
      TypeOfRequest.MetaTransfer,
      signer,
      forwarderConnected,
      provider,
      {
        // Here signer is trying to transact for accounts[5]
        from: signerAddress,
        to: receiver.address,
        tokenAddr: recipient.address,
        amount: ethers.utils.parseEther("2").toString(),
      }
    );

    const signerBalanceBeforeTx = await recipient.balanceOf(signerAddress);
    const receiverBalanceBeforeTx = await recipient.balanceOf(receiver.address);

    await forwarderConnected.executeTransaction([request], [signature]);

    const signerBalanceAfterTx = await recipient.balanceOf(signerAddress);
    const receiverBalanceAfterTx = await recipient.balanceOf(receiver.address);

    expect(signerBalanceBeforeTx).to.equal(signerBalanceAfterTx);
    expect(receiverBalanceBeforeTx).to.equal(receiverBalanceAfterTx);
  });

  it("Does not transfer tokens twice if signer's nonce is same for 2 txs", async () => {
    const provider = waffle.provider;

    const relayer = accounts[0];

    const signer = provider.getSigner(2);
    const signerAddress = await signer.getAddress();
    await recipient.mint(signerAddress, ethers.utils.parseEther("2"));

    const forwarderConnected = forwarder.connect(relayer);
    const receiver = accounts[4];

    const { request: request1, signature: signature1 } =
      await signMetaTxRequest(
        TypeOfRequest.MetaTransfer,
        signer,
        forwarderConnected,
        provider,
        {
          from: signerAddress,
          to: receiver.address,
          tokenAddr: recipient.address,
          amount: ethers.utils.parseEther("1").toString(),
        }
      );

    const { request: request2, signature: signature2 } =
      await signMetaTxRequest(
        TypeOfRequest.MetaTransfer,
        signer,
        forwarderConnected,
        provider,
        {
          from: signerAddress,
          to: receiver.address,
          tokenAddr: recipient.address,
          amount: ethers.utils.parseEther("1").toString(),
        }
      );

    const signerBalanceBeforeTx = await recipient.balanceOf(signerAddress);
    const receiverBalanceBeforeTx = await recipient.balanceOf(receiver.address);

    await forwarderConnected.executeTransaction(
      [request1, request2],
      [signature1, signature2]
    );

    const signerBalanceAfterTx = await recipient.balanceOf(signerAddress);
    const receiverBalanceAfterTx = await recipient.balanceOf(receiver.address);

    expect(signerBalanceBeforeTx).to.equal(ethers.utils.parseEther("2"));
    expect(signerBalanceAfterTx).to.equal(ethers.utils.parseEther("1"));
    expect(receiverBalanceBeforeTx).to.equal(0);
    expect(receiverBalanceAfterTx).to.equal(ethers.utils.parseEther("1"));
  });

  it("Does not transfer tokens if expiry block is reached", async () => {
    const provider = waffle.provider;

    const relayer = accounts[0];

    const signer = provider.getSigner(2);
    const signerAddress = await signer.getAddress();
    await recipient.mint(signerAddress, ethers.utils.parseEther("1"));

    const forwarderConnected = forwarder.connect(relayer);
    const receiver = accounts[4];

    const { request, signature } = await signMetaTxRequest(
      TypeOfRequest.MetaTransfer,
      signer,
      forwarderConnected,
      provider,
      {
        from: signerAddress,
        to: receiver.address,
        tokenAddr: recipient.address,
        amount: ethers.utils.parseEther("1").toString(),
      }
    );

    const signerBalanceBeforeTx = await recipient.balanceOf(signerAddress);
    const receiverBalanceBeforeTx = await recipient.balanceOf(receiver.address);

    await provider.send("hardhat_mine", ["0x100"]);

    await forwarderConnected.executeTransaction([request], [signature]);

    const signerBalanceAfterTx = await recipient.balanceOf(signerAddress);
    const receiverBalanceAfterTx = await recipient.balanceOf(receiver.address);

    expect(signerBalanceBeforeTx).to.equal(signerBalanceAfterTx);
    expect(receiverBalanceBeforeTx).to.equal(receiverBalanceAfterTx);
  });
});
