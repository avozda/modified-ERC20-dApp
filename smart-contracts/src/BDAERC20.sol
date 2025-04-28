//SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract BDAERC20 is ERC20 {
    address public immutable owner;
    uint256 public immutable maxSupply;
    uint256 public immutable maxDailyMint;

    constructor(
        uint256 _maxSupply,
        uint256 _maxDailyMint
    ) ERC20("BDA25 Token", "BDA25") {
        owner = msg.sender;
        maxSupply = _maxSupply;
        maxDailyMint = _maxDailyMint;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= maxSupply, "Exceeds maximum supply");
        _mint(to, amount);
    }
}
