
import { ethers } from 'hardhat';
const colors = require('colors/safe');

import { CrossChainBridge__factory, MultiRouter__factory } from '../typechain';
const test_util = require('./util')
const config = require('../scripts/config.json')

async function main() {
    const [deployer] = await ethers.getSigners();



    const chainId = 43113;
    //const multiRouter = await new MultiRouter__factory(deployer).deploy(deployer.address)
    //await multiRouter.deployed()
    //console.log(`${colors.cyan('multiRouter Address')}: ${colors.yellow(multiRouter.address)}`)


    const mRouter = "0xb03218e8cb18E9c1834941EA76A8361eC1E175d4"
   
    const chainConfig = config.find((c: any) => c.chainId === chainId);
    /*
    await multiRouter.setRouterAddress(chainId, chainConfig.swapRouter)
    await multiRouter.setUDSCAddress(chainId, chainConfig.usdc)

    const routers = await multiRouter.routers(chainId)
    const udscAddress = await multiRouter.getUDSCAddress(chainId)
    const nativeToken = await multiRouter.getNativeTokenAddress(chainId)
    console.log(`${colors.cyan('Swap Router Address')}: ${colors.yellow(routers)}`)
    console.log(`${colors.cyan('USDC Address')}: ${colors.yellow(udscAddress)}`)
    console.log(`${colors.cyan('Native Token Address')}: ${colors.yellow(nativeToken)}`)
    */


    const crossChainBridge = await new CrossChainBridge__factory(deployer).deploy(chainConfig.router, chainConfig.link, mRouter)
    await crossChainBridge.deployed()
    console.log(`${colors.cyan('crossChainBridge Address')}: ${colors.yellow(crossChainBridge.address)}`)
    const tx = await crossChainBridge.deployTransaction.wait(8)
    test_util.verify(crossChainBridge?.address, chainConfig.router, chainConfig.link)

    //await crossChainBridge.setRouterAddress(chainConfig.swapRouter)
    //await crossChainBridge.setUDSCAddress(chainConfig.usdc)

    await test_util.transferEth(deployer, crossChainBridge.address, 0.01)


    await crossChainBridge.allowlistSourceChain(chainConfig.sourceChain, true)
    await crossChainBridge.allowlistSender(deployer.address, true)
    for (let i = 0; i < chainConfig.allowedChains.length; i++) {
        await crossChainBridge.allowlistDestinationChain(chainConfig.allowedChains[i], true)
    }



    const destination = chainConfig.allowedChains[0];
    await crossChainBridge.sendNativeMessage(destination, crossChainBridge.address, "a", { value: ethers.utils.parseEther("0.0001") })







}


main().catch((error: Error) => {
    console.error(error)
    process.exitCode = 1
})


