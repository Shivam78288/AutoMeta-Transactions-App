import React, { useEffect, useState } from "react";
import FormRow from "../components/FormRow";
import { useAppContext } from "../state/appContext";
import {
  fetchRequests,
  sendRelayTx,
  sendTransferRequest,
  sendTransferFromRequest,
  sendAppoveRequest,
} from "../web3/sendMetaTx";
import { ethers } from "ethers";
import Table from "../components/Table";
import Alert from "../components/Alert";
import FormSelect from "../components/FormSelect";

const Main = () => {
  const [txType, setTxType] = useState("Transfer");
  const state = useAppContext();

  useEffect(() => {
    const interval = setInterval(
      () => {
        sendRelayTx().then((res) => {
          console.log(res);
          if (res.request) {
            state?.addToTable(res);
          }
        });
      },
      process.env.REACT_APP_RELAY_INTERVAL
        ? Number(process.env.REACT_APP_RELAY_INTERVAL)
        : 120000
    );
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const interval = setInterval(
      () => {
        fetchRequests().then((res) => {
          console.log(res);
          if (
            Number(res.estimatedGas) >
            (process.env.MAX_GAS ? process.env.MAX_GAS : 100000)
          ) {
            sendRelayTx().then((res) => {
              console.log(res);
              if (res.request) {
                state?.addToTable(res);
              }
            });
          }
        });
      },
      process.env.REACT_APP_QUERY_INTERVAL
        ? Number(process.env.REACT_APP_QUERY_INTERVAL)
        : 5000
    );
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, []);

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (state?.currentUser === "") {
      state?.displayAlert("danger", "Please connect your wallet");
      return;
    }

    if (
      !state?.currentRecipient ||
      !state?.currentAmount ||
      !state?.currentToken
    ) {
      state?.displayAlert("danger", "Please provide all values");
      return;
    }

    let isAmountValid = /^\d+$/.test(state.currentAmount);

    if (
      !ethers.utils.isAddress(state.currentRecipient) ||
      !ethers.utils.isAddress(state.currentToken) ||
      !isAmountValid
    ) {
      state?.displayAlert("danger", "Please provide valid values");
      return;
    }

    if (txType === "Transfer") {
      try {
        sendTransferRequest(
          state.currentRecipient,
          state.currentAmount,
          state.currentToken
        ).then((response) => {
          console.log(response);
          state?.displayAlert(
            "success",
            "Request sent to the server. Please wait sometime for the tx to complete."
          );
        });
      } catch (err) {
        console.log(err);
      }
    } else if (txType === "Approve") {
      try {
        sendAppoveRequest(
          state.currentRecipient,
          state.currentAmount,
          state.currentToken
        ).then((response) => {
          console.log(response);
          state?.displayAlert(
            "success",
            "Request sent to the server. Please wait sometime for the tx to complete."
          );
        });
      } catch (err) {
        console.log(err);
      }
    } else if (txType === "Transfer From") {
      if (!state.ownerAddForTransferFrom) {
        state.displayAlert("danger", "Please provide all values");
      }
      if (!ethers.utils.isAddress(state.ownerAddForTransferFrom)) {
        state.displayAlert("danger", "Invalid owner address");
      }
      try {
        sendTransferFromRequest(
          state.ownerAddForTransferFrom,
          state.currentRecipient,
          state.currentAmount,
          state.currentToken
        ).then((response) => {
          console.log(response);
          state?.displayAlert(
            "success",
            "Request sent to the server. Please wait sometime for the tx to complete."
          );
        });
      } catch (err) {
        console.log(err);
      }
    } else {
      state.displayAlert("danger", "Invalid transaction type");
    }

    setTimeout(() => {
      state.clearFields();
    }, 5000);
  };

  const clearFields = (e: React.SyntheticEvent) => {
    e.preventDefault();
    state?.clearFields();
  };

  const handleInput = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLInputElement;
    state?.handleChange({ key: target.name, value: target.value });
  };

  const handleTxTypeChange = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLInputElement;
    setTxType(target.value);
  };

  return (
    <>
      <form className="form">
        <h3 style={{ fontWeight: 100, textAlign: "center" }}>
          Create Meta Transaction
        </h3>
        {state?.showAlert && <Alert />}
        <div className="form-center">
          <FormSelect
            labelText="Transaction Type"
            name="type"
            value={txType}
            options={["Transfer", "Transfer From", "Approve"]}
            handleChange={handleTxTypeChange}
          ></FormSelect>
          <FormRow
            type="text"
            name="currentToken"
            value={state ? state.currentToken : ""}
            handleChange={handleInput}
            labelText="Token Address"
          />
          {txType === "Transfer From" && (
            <FormRow
              type="text"
              name="ownerAddForTransferFrom"
              value={state ? state.ownerAddForTransferFrom : ""}
              handleChange={handleInput}
              labelText="From"
            />
          )}
          <FormRow
            type="text"
            name="currentRecipient"
            value={state ? state.currentRecipient : ""}
            handleChange={handleInput}
            labelText="Recipient Address"
          />
          <FormRow
            type="text"
            name="currentAmount"
            value={state ? state.currentAmount : ""}
            labelText="Amount"
            handleChange={handleInput}
          />
          <div className="btn-container">
            <button
              type="submit"
              className="btn btn-block"
              onClick={handleSubmit}
              style={{ marginTop: 10 }}
            >
              submit
            </button>
            <button
              className="btn btn-block clear-btn"
              onClick={clearFields}
              style={{ marginTop: 20 }}
            >
              clear
            </button>
          </div>
        </div>
      </form>
      {state?.table && state.table.length > 0 && <Table data={state?.table} />}
    </>
  );
};

export default Main;
