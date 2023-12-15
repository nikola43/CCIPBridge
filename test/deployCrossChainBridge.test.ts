import '@nomiclabs/hardhat-ethers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';
const test_util = require('../scripts/util');
const colors = require('colors');
const config = require('../scripts/config.json')
import { CrossChainBridge, CrossChainBridge__factory, MultiRouter, MultiRouter__factory } from '../typechain'
import { parseEther, parseUnits } from 'ethers/lib/utils';

import hre from 'hardhat'

//available functions
describe("Token contract", async () => {
    let deployer: SignerWithAddress;
    let bob: SignerWithAddress;
    let alice: SignerWithAddress;
    let multiRouter: MultiRouter;
    let crossChainBridge: CrossChainBridge;

    it("1. Get Signer", async () => {
        const signers = await ethers.getSigners();

        deployer = signers[0];
        bob = signers[1];
        alice = signers[2];

        console.log(`${colors.cyan('Deployer Address')}: ${colors.yellow(deployer?.address)}`)
        console.log(`${colors.cyan('Bob Address')}: ${colors.yellow(bob?.address)}`)
        console.log(`${colors.cyan('Alice Address')}: ${colors.yellow(alice?.address)}`)
    });


    it("2. Deploy Multirouter", async () => {
        const chainId = 43113;
        multiRouter = await new MultiRouter__factory(deployer).deploy(deployer.address)
        await multiRouter.deployed()
        console.log(`${colors.cyan('multiRouter Address')}: ${colors.yellow(multiRouter.address)}`)
    })

    it("3. Set Swap router and usdc address", async () => {
        const chainId = 43113;
        const chainConfig = config.find((c: any) => c.chainId === chainId);
        await multiRouter.setRouterAddress(chainId, chainConfig.swapRouter)
        await multiRouter.setUDSCAddress(chainId, chainConfig.usdc)

        const routers = await multiRouter.routers(chainId)
        const udscAddress = await multiRouter.getUDSCAddress(chainId)
        const nativeToken = await multiRouter.getNativeTokenAddress(chainId)
        console.log(`${colors.cyan('Swap Router Address')}: ${colors.yellow(routers)}`)
        console.log(`${colors.cyan('USDC Address')}: ${colors.yellow(udscAddress)}`)
        console.log(`${colors.cyan('Native Token Address')}: ${colors.yellow(nativeToken)}`)
    })

    it("4. Deploy Bridge", async () => {
        const chainId = 43113;
        const chainConfig = config.find((c: any) => c.chainId === chainId);
        crossChainBridge = await new CrossChainBridge__factory(deployer).deploy(chainConfig.router, chainConfig.link, multiRouter.address)
        await crossChainBridge.deployed()
        console.log(`${colors.cyan('Cross Chain Bridge Address')}: ${colors.yellow(crossChainBridge.address)}`)

        await crossChainBridge.setDevAddress(deployer.address)

        //await crossChainBridge.setRouterAddress(chainConfig.swapRouter)
        //await crossChainBridge.setUDSCAddress(chainConfig.usdc)

        await test_util.transferEth(deployer, crossChainBridge.address, 1)
    })

    it("5. Whitelist source, destination and sender", async () => {
        const chainId = 43113;
        const chainConfig = config.find((c: any) => c.chainId === chainId);
        await crossChainBridge.allowlistSourceChain(chainConfig.sourceChain, true)
        await crossChainBridge.allowlistSender(deployer.address, true)
        for (let i = 0; i < chainConfig.allowedChains.length; i++) {
            await crossChainBridge.allowlistDestinationChain(chainConfig.allowedChains[i], true)
        }
    })


    it("5. Deposit eth", async () => {
        const chainId = 84531;
        const chainConfig = config.find((c: any) => c.chainId === chainId);
        const destination = chainConfig.allowedChains[0];
        const tx = await (await crossChainBridge.sendNativeMessage(destination, crossChainBridge.address, "a", { value: ethers.utils.parseEther("0.1") })).wait()
        /*
        console.log({
            tx: tx.transactionHash
        })
        */

        const MessageSentLog = tx.logs.find((log) => {
            try {
                return crossChainBridge.interface.parseLog(log).name === "MessageSent"
            } catch (e) {
                /*
                console.log({
                    error: e
                })
                */
            }
        })
        const parsedLog = crossChainBridge.interface.parseLog(MessageSentLog!)
        console.log({
            parsedLog: parsedLog
        })
        const { messageId, tokenAmount, token } = parsedLog.args
        /*
        tx.logs.map((log) => {
            try {
                const parsedLog = crossChainBridge.interface.parseLog(log)
                console.log({
                    parsedLog: parsedLog
                })
            } catch (e) {
                console.log({
                    error: e
                })
            }
        })
        */
    })




    /*
    it("5. Withdraw eth", async () => {
        await crossChainBridge.withdraw(bob.address, parseEther("0.0000001"))
    })
    */



    /*
it("5. Buy USDC", async () => {
    const chainId = 43113;
    const chainConfig = config.find((c: any) => c.chainId === chainId);
    const router = await test_util.connectRouter()

    const whale = "0xF745b439965c66425958159e91E7e04224Fed29D"
    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [whale],
    });

    const signer = await ethers.getSigner(whale)

    const usdcToken = await ethers.getContractAt("MyToken", chainConfig.usdc)

    await usdcToken.connect(signer).transfer(bob.address, parseUnits("1000", 6))

    const usdcBalance = await usdcToken.balanceOf(bob.address)
    console.log(`${colors.cyan('USDC Balance')}: ${colors.yellow(usdcBalance.toString())}`)


    //await test_util.swapExactETHForTokens(chainConfig.usdc, router, bob, parseEther("1"));
})


it("5. Deposit Tokens", async () => {
    const chainId = 43113;
    const chainConfig = config.find((c: any) => c.chainId === chainId);
    const destination = chainConfig.allowedChains[0];

    const usdcToken = await ethers.getContractAt("MyToken", chainConfig.usdc)

    await usdcToken.connect(bob).approve(crossChainBridge.address, parseUnits("10000000000", 6))
    await crossChainBridge.connect(bob).sendTokenMessage(destination, crossChainBridge.address, "a", chainConfig.usdc, parseUnits("100", 6))
})

 
it("5. Withdraw tokens", async () => {
    const chainId = 43113;
    const chainConfig = config.find((c: any) => c.chainId === chainId);
    await crossChainBridge.withdrawToken(bob.address, chainConfig.usdc, parseUnits("5", 6))
})
*/

});

