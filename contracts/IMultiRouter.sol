// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

interface IMultiRouter {
    function swapTokensForNative(
        uint256 chainId,
        address token,
        address to,
        uint256 amount
    ) external;

    function swapNativeForTokens(
        uint256 chainId,
        address token,
        address to,
        uint256 amount
    ) external payable;

    function getNativeTokenAddress(
        uint256 chainId
    ) external view returns (address);

    function getUDSCAddress(uint256 chainId) external view returns (address);
}
