export type ForwardRequestType = {
  from: string;
  to: string;
  tokenAddr: string;
  amount: string;
  nonce: string;
  expiryBlock: string;
};

export type TypedDataType = {
  types: {
    EIP712Domain: {
      name: string;
      type: string;
    }[];
    ForwardRequest: {
      name: string;
      type: string;
    }[];
  };
  domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
  };
  primaryType: string;
};

export type FullTypedDataType = {
  message: ForwardRequestType;
  types: {
    EIP712Domain: {
      name: string;
      type: string;
    }[];
    ForwardRequest: {
      name: string;
      type: string;
    }[];
  };
  domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
  };
  primaryType: string;
};

export interface ResponseType {
  request: ForwardRequestType[];
  result: boolean[];
}

export interface TableColumnType {
  heading: string;
  value: string;
  key: number;
}

export interface TableRowType {
  Key: string;
  From: string;
  To: string;
  Token: string;
  Amount: string;
  Status: string;
}

export interface AppContextInterface {
  currentUser: string;
  currentRecipient: string;
  currentAmount: string;
  currentToken: string;
  showAlert: boolean;
  alertType: string;
  alertText: string;
  table: TableRowType[];
  setCurrentUser: (currentUser: string) => void;
  handleChange: ({ key, value }: { key: string; value: string }) => void;
  clearFields: () => void;
  addToTable: (res: ResponseType) => void;
  displayAlert: (alertType: string, alertText: string) => void;
  clearAlert: () => void;
}

export interface State {
  currentUser: string;
  currentRecipient: string;
  currentAmount: string;
  currentToken: string;
  showAlert: boolean;
  alertType: string;
  alertText: string;
  table: TableRowType[];
}

export interface ActionType {
  type: string;
  payload?: any;
}
