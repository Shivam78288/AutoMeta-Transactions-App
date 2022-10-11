    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.9;

    import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
    import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

    interface IRecipientERC20 is IERC20, IERC20Metadata{
        event MetaTransfer(address from,address to,uint256 amount);
        event MetaApproval(address owner,address spender,uint256 amount);
        event MetaTransferFrom(address caller,address owner,address to,uint256 amount);

        function requestFromForwarder(bytes4 selector, bytes calldata data) external returns(bool);   
}

