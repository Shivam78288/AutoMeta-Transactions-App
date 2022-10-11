import React, { useReducer, useContext } from "react";
import {
  HANDLE_CHANGE,
  SET_CURRENT_USER,
  CLEAR_FIELDS,
  ADD_TO_TABLE,
  SHOW_ALERT,
  CLEAR_ALERT,
} from "./actions";
import reducer from "./reducer";
import { AppContextInterface, ResponseToSend, State } from "../types/types";

const appContext = React.createContext<AppContextInterface | null>(null);

const initialState: State = {
  currentUser: "",
  currentRecipient: "",
  currentAmount: "",
  currentToken: "",
  ownerAddForTransferFrom: "",
  showAlert: false,
  alertType: "",
  alertText: "",
  table: [],
};

const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setCurrentUser = (currentUser: string) => {
    dispatch({ type: SET_CURRENT_USER, payload: { currentUser } });
  };

  const handleChange = ({ key, value }: { key: string; value: string }) => {
    dispatch({ type: HANDLE_CHANGE, payload: { key, value } });
  };

  const clearFields = () => {
    dispatch({ type: CLEAR_FIELDS });
  };

  const displayAlert = (alertType: string, alertText: string) => {
    dispatch({ type: SHOW_ALERT, payload: { alertType, alertText } });
    clearAlert();
  };

  const clearAlert = () => {
    setTimeout(() => {
      dispatch({ type: CLEAR_ALERT });
    }, 3000);
  };

  const addToTable = (res: ResponseToSend) => {
    dispatch({
      type: ADD_TO_TABLE,
      payload: { requests: res.request, results: res.result },
    });
  };

  return (
    <appContext.Provider
      value={{
        ...state,
        setCurrentUser,
        handleChange,
        clearFields,
        addToTable,
        displayAlert,
        clearAlert,
      }}
    >
      {children}
    </appContext.Provider>
  );
};

const useAppContext = () => {
  return useContext(appContext);
};

export { AppProvider, useAppContext };
