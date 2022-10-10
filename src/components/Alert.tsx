import React from "react";
import styled from "styled-components";
import { useAppContext } from "../state/appContext";

const StyledDiv = styled.div`
  padding: 0.5rem;
  width: 75%;
  text-align: center;
  margin: auto;
  display: grid;
`;

const Alert = () => {
  const state = useAppContext();
  return (
    <StyledDiv className={`alert alert-${state?.alertType}`}>
      {state?.alertText}
    </StyledDiv>
  );
};

export default Alert;
