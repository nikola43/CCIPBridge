// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract MultiRouter is Ownable {
    // constants
    uint256 public constant MAX_INT = type(uint256).max;
    uint256 public constant AVALANCHE_CHAIN_ID = 43113;
    //address public constant AVALANCHE_CHAIN_ID = 43114;

    // errors
    error InvalidChainId(uint256 chainId);

    // mapping for store the router address for each chain
    mapping(uint256 => address) public routers;

    // mapping for store UDSC address for each chain
    mapping(uint256 => address) public udscAddress;

    constructor(address initialOwner) Ownable(initialOwner) {}

    // set the router address for the given chain id
    function setRouterAddress(
        uint256 chainId,
        address routerAddress
    ) public onlyOwner {
        routers[chainId] = routerAddress;
    }

    // set the UDSC address for the given chain id
    function setUDSCAddress(
        uint256 chainId,
        address udscAddress_
    ) public onlyOwner {
        udscAddress[chainId] = udscAddress_;
    }

    // return the route given the busd addresses and the token
    function buildPath(
        address add1,
        address add2
    ) private pure returns (address[] memory) {
        address[] memory path = new address[](2);
        path[0] = add1;
        path[1] = add2;
        return path;
    }

    function getNativeTokenAddress(
        uint256 chainId
    ) public view returns (address) {
        string memory methodName = chainId == AVALANCHE_CHAIN_ID
            ? "WAVAX()"
            : "WETH()";
        (bool success, bytes memory data) = routers[chainId].staticcall(
            abi.encodeWithSelector(bytes4(keccak256(bytes(methodName))))
        );
        if (!success) revert InvalidChainId(chainId);
        return abi.decode(data, (address));
    }

    function swapTokensForNative(
        uint256 chainId,
        address token,
        address to,
        uint256 amount
    ) external {
        address nativeTokenAddress = getNativeTokenAddress(chainId);
        address[] memory path = buildPath(token, nativeTokenAddress);

        string memory methodName = chainId == AVALANCHE_CHAIN_ID
            ? "swapExactTokensForAVAXSupportingFeeOnTransferTokens(uint256,uint256,address[],address,uint256)"
            : "swapExactTokensForETHSupportingFeeOnTransferTokens(uint256,uint256,address[],address,uint256)";

        IERC20(token).approve(routers[chainId], type(uint256).max);

        (bool success, ) = routers[chainId].call(
            abi.encodeWithSelector(
                bytes4(keccak256(bytes(methodName))),
                amount,
                0,
                path,
                to,
                block.timestamp + 20000
            )
        );
        if (!success) revert InvalidChainId(chainId);
    }

    function swapNativeForTokens(
        uint256 chainId,
        address token,
        address to,
        uint256 amount
    ) external payable {
        address nativeTokenAddress = getNativeTokenAddress(chainId);
        address[] memory path = buildPath(nativeTokenAddress, token);

        string memory methodName = chainId == AVALANCHE_CHAIN_ID
            ? "swapExactAVAXForTokens(uint256,address[],address,uint256)"
            : "swapExactETHForTokens(uint256,address[],address,uint256)";

        (bool success, ) = routers[chainId].call{value: amount}(
            abi.encodeWithSelector(
                bytes4(keccak256(bytes(methodName))),
                0,
                path,
                to,
                block.timestamp + 20000
            )
        );

        if (!success) revert InvalidChainId(chainId);
    }

    function getUDSCAddress(uint256 chainId) external view returns (address) {
        return udscAddress[chainId];
    }
}
