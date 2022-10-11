import React, { useEffect } from "react";
import { useAppContext } from "../state/appContext";
import { ethers } from "ethers";
import styled from "styled-components";

const StyledDiv = styled.div`
  height: 6rem;
  display: flex;
  align-items: center;
  text-align: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1rem;
  background: var(--primary-100);
  margin-bottom: 10px;
  padding-top: 1rem;
`;

const Wallet = styled.div`
  color: var(--grey-50);
  background-color: var(--primary-500);
  border-radius: var(--borderRadius);
  padding: 0.5rem;
  text-align: center;
  margin: auto;
  display: grid;
  margin: 3rem auto;
  width: 90vw;
  max-width: var(--fixed-width);
`;

const Button = styled.button`
  color: var(--grey-50);
  background-color: var(--primary-500);
  border-radius: var(--borderRadius);
  text-align: center;
  display: grid;
  padding: 0.5rem;
  margin: 3rem auto;
  width: 90vw;
  max-width: var(--fixed-width);
`;

const Header = () => {
  const state = useAppContext();

  const connect = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    console.log("Account: ", await signer.getAddress());
    state?.setCurrentUser(await signer.getAddress());
  };

  useEffect(() => {
    const accountChangeListener = window.ethereum.on(
      "accountsChanged",
      (accounts: any[]) => {
        console.log("Account: ", accounts[0]);
        state?.setCurrentUser(accounts[0]);
      }
    );
    return () => {
      window.removeEventListener("accountsChanged", accountChangeListener);
    };
    // eslint-disable-next-line
  }, []);

  return (
    <>
      <StyledDiv>
        <h1>AutoMeta Transactions</h1>
      </StyledDiv>
      {state?.currentUser && <Wallet>{state?.currentUser}</Wallet>}
      {!state?.currentUser && (
        <Button className="btn btn-block" onClick={connect}>
          Connect
        </Button>
      )}
    </>
  );
};

export default Header;
