    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.9;

    import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
    import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

    interface IRecipientERC20 is IERC20, IERC20Metadata{
        event MetaTransfer(address from,address to,uint256 amount);

        function metaTransfer(
            address from, 
            address to, 
            uint256 amount
            ) external returns(bool success);
    }

