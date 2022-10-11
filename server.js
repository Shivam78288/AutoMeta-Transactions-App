const express = require("express");
const ForwarderAbi = require("./src/abi/Forwarder.json");
const { Forwarder } = require("./src/deploy.json");
const ethers = require("ethers");
require("dotenv").config();

const app = express();

this.requests = [];
this.signatures = [];

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(express.json());

app.get("/requests", async (req, res) => {
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
  const provider = new ethers.providers.JsonRpcProvider(process.env.MUMBAI_RPC);
  const connectedWallet = wallet.connect(provider);

  const forwarderContract = new ethers.Contract(
    Forwarder,
    ForwarderAbi,
    connectedWallet
  );

  const estimatedGas = await forwarderContract.estimateGas.executeTransaction(
    this.requests,
    this.signatures
  );

  res.status(200).send({
    requests: this.requests,
    estimatedGas: parseInt(estimatedGas._hex).toString(),
  });
});

app.post("/txRequest", async (req, res) => {
  // setup to verify incoming signature and request
  const types = {
    ForwardRequest: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "nonce", type: "uint256" },
      { name: "expiryBlock", type: "uint256" },
      // { name: "functionSelector", type: "bytes4" },
      { name: "data", type: "bytes" },
    ],
  };

  const domain = {
    name: "Forwarder",
    version: "0.0.1",
    chainId: 80001,
    verifyingContract: Forwarder,
  };

  const { request, signature } = req.body;
  const verifiedAddress = ethers.utils.verifyTypedData(
    domain,
    types,
    request,
    signature
  );

  if (request.from !== verifiedAddress) {
    return res.status(400).send({
      msg: "The Transaction could not get verified.",
    });
  }

  this.requests.push(request);
  this.signatures.push(signature);

  res.status(200).send({ request, signature });
});

app.post("/relayTransaction", async (req, res) => {
  if (this.requests.length !== this.signatures.length) {
    return res.status(400).send({ msg: "Array lengths not matching" });
  }

  if (this.requests.length === 0) {
    return res.status(200).send({ msg: "No transactions to relay" });
  }

  const requests = [...this.requests];
  const signatures = [...this.signatures];
  this.requests = [];
  this.signatures = [];

  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
  const provider = new ethers.providers.JsonRpcProvider(process.env.MUMBAI_RPC);
  const connectedWallet = wallet.connect(provider);

  // send transaction to forwarder contract
  const forwarderContract = new ethers.Contract(
    Forwarder,
    ForwarderAbi,
    connectedWallet
  );

  const contractTx = await forwarderContract.executeTransaction(
    requests,
    signatures
  );

  const transactionReceipt = await contractTx.wait();
  console.log(transactionReceipt);

  const event = transactionReceipt.events.find(
    (event) => event.event === "CallResult"
  );

  const request = event.args[0].map((req) => {
    const nonce = parseInt(req[2]._hex, 16).toString();
    return {
      from: req[0],
      to: req[1],
      nonce: nonce,
      // functionSelector: req[4],
      data: req[4],
    };
  });

  const result = event.args[1];

  console.log({ request, result });
  return res.status(200).send({ request, result });
});

app.listen(4000, () => {
  console.log("listening on port 4000!");
});
