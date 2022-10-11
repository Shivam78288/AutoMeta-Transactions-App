import { ActionType, Request, State } from "../types/types";
import {
  SET_CURRENT_USER,
  HANDLE_CHANGE,
  CLEAR_FIELDS,
  ADD_TO_TABLE,
  CLEAR_ALERT,
  SHOW_ALERT,
} from "./actions";

const reducer = (state: State, action: ActionType) => {
  if (action.type === SET_CURRENT_USER) {
    return { ...state, currentUser: action.payload.currentUser };
  }

  if (action.type === HANDLE_CHANGE) {
    return { ...state, [action.payload.key]: action.payload.value };
  }

  if (action.type === CLEAR_FIELDS) {
    const initialState = {
      currentRecipient: "",
      currentAmount: "",
      currentToken: "",
      ownerAddForTransferFrom: "",
    };
    return { ...state, ...initialState };
  }

  if (action.type === ADD_TO_TABLE) {
    const newTables = action.payload.requests.map(
      (req: Request, index: number) => {
        return {
          Key: new Date(),
          From: req.from,
          To: req.to,
          Token: req.tokenAddr,
          txType: req.txType,
          Amount: (Number(req.amount) / 10 ** 18).toString(),
          Status: action.payload.results[index] ? "Success" : "Failed",
        };
      }
    );

    return {
      ...state,
      table: [...state.table, ...newTables],
    };
  }

  if (action.type === CLEAR_ALERT) {
    return { ...state, showAlert: false, alertType: "", alertText: "" };
  }

  if (action.type === SHOW_ALERT) {
    return {
      ...state,
      showAlert: true,
      alertType: action.payload.alertType,
      alertText: action.payload.alertText,
    };
  }

  throw new Error("Undefined action");
};

export default reducer;
