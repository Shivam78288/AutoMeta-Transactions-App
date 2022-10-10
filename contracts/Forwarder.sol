// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "./IRecipientERC20.sol";

contract Forwarder is EIP712 {
    using ECDSA for bytes32;

   struct ForwardRequest {
        address from;
        address to;
        address tokenAddr;
        uint256 amount;
        uint256 nonce;
        uint256 expiryBlock;
    }
    
    bytes32 private constant _TYPEHASH = keccak256("ForwardRequest(address from,address to,address tokenAddr,uint256 amount,uint256 nonce,uint256 expiryBlock)");
    address private _relayer;
    address private _owner;

    mapping(address => uint256) private _nonces;

    event CallResult(ForwardRequest[], bool[]);

    modifier onlyOwner {
        require(_owner == msg.sender, "Only owner");
        _;
    }

    constructor(address relayer) EIP712("Forwarder", "0.0.1") {
        _owner = msg.sender;
        _relayer = relayer;
    }

    function getNonce(address from) public view returns (uint256) {
        return _nonces[from];
    }

    function getRelayer() public view returns(address){
        return _relayer;
    }

    function getOwner() public view returns(address){
        return _owner;
    }

    function setRelayer(address relayer) external onlyOwner{
        _relayer = relayer; 
    }

    function setOwner(address owner) external onlyOwner{
        _owner = owner; 
    }

    function verify(ForwardRequest calldata req, bytes calldata signature) public view returns (bool) {
        address signer = _hashTypedDataV4(
            keccak256(abi.encode(_TYPEHASH, req.from, req.to, req.tokenAddr, req.amount, req.nonce, req.expiryBlock))
        ).recover(signature);
        return _nonces[req.from] == req.nonce && signer == req.from;
    }

    function executeTransaction(
        ForwardRequest[] calldata requests, 
        bytes[] calldata signatures
        ) public returns(bool[] memory) 
    {
        require(_relayer == msg.sender, "Only relayer");
        require(requests.length == signatures.length, "Array length mismatch");

        bool[] memory success = new bool[](requests.length); 
        
        for(uint16 i = 0; i < requests.length; i++){            
            if(!verify(requests[i], signatures[i])){
                success[i] = false;
                continue;
            }

            if(requests[i].expiryBlock < block.number){
                success[i] = false;
                continue;
            }

            _nonces[requests[i].from] = requests[i].nonce + 1;

            address tokenAddr = requests[i].tokenAddr;
            address from = requests[i].from;
            address to = requests[i].to;
            uint256 amount = requests[i].amount;
            IRecipientERC20 token = IRecipientERC20(tokenAddr);

            bool value = token.metaTransfer(from, to, amount);
            success[i] = value;

        }

        emit CallResult(requests, success);
        return success;
    }
}

