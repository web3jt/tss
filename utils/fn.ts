import { ethers } from 'ethers';
import fs from 'fs';
import prompts from './prompts';
import CONFIG from './config';


const hint = function (hintString: string = '', targetLength: number = 6) {
    if (0 < targetLength) {
        console.log(`\n--------- --------- ${hintString.padEnd(targetLength, ' ')} --------- ---------`);
    } else {
        console.log(`\n--------- --------- ${hintString} --------- ---------`);
    }
}

const hi = function (hintString: string) {
    hint(hintString, 0);
}

const touchDir = function (p: string) {
    const _arr = p.split('/');
    const _pos = _arr[0] === '' ? 1 : 0;
    for (let i = _pos; i < _arr.length; i++) {
        const _p = _arr.slice(0, i + 1).join('/');

        if (!fs.existsSync(_p)) {
            fs.mkdirSync(_p);
        }
    }
}

const getProvider = async function () {
    const selected = CONFIG.EVM_NETWORKS.SELECTED;
    const confirm = await prompts.askForConfirm(`Use ${selected} network?`);

    if (confirm) {
        return new ethers.JsonRpcProvider(CONFIG.EVM_NETWORKS[selected])
    }

    console.log('');
    process.exit(0);
}

/**
 * Get wallets from a BIP39 mnemonic
 */
const deriveWallets = async function (amount: number = 20): Promise<ethers.HDNodeWallet[]> {
    hi('Derive Wallet Accounts');

    let wallets: ethers.HDNodeWallet[] = [];

    const words = CONFIG['MNEMONIC'].split(' ');

    if (CONFIG['MNEMONIC'] && await prompts.askForConfirm(`Mnemonic: ${words.slice(0, 2).join(' ')} ... ${words.slice(-2).join(' ')}`)) {
        const passphrase = await prompts.askForPassphrase();
        const baseWallet = ethers.HDNodeWallet.fromPhrase(CONFIG['MNEMONIC'], passphrase);
        const baseAccount = baseWallet.deriveChild(0);

        if (await prompts.askForConfirm(`Wallet #0: ${baseAccount.address}`)) {
            const accountIndex = await prompts.askForAccountIndex();
            const account0 = baseWallet.deriveChild(accountIndex);
            if (await prompts.askForConfirm(`Account#0: ${account0.address}`)) {
                if (0 === amount) {
                    amount = await prompts.askForNumber('Amount');
                }

                for (let i = accountIndex; i < accountIndex + amount; i++) {
                    wallets.push(baseWallet.deriveChild(i));
                }
            }
        }
    }

    if (0 < wallets.length) {
        return wallets;
    }

    console.log('');
    process.exit(0);
}

// /**
//  * Convert a message hash to an Ethereum Signed Message hash
//  * 
//  * @param {string} messageHash
//  * @return {string}
//  * 
//  * @see https://eips.ethereum.org/EIPS/eip-191
//  */
// function toEthSignedMessageHash(messageHash: string): string {
//     return ethers.utils.solidityKeccak256(
//         ['string', 'bytes32'],
//         ['\x19Ethereum Signed Message:\n32', messageHash]
//     );
// }

export default {
    hint: hint,
    hi: hi,
    touchDir: touchDir,
    getProvider: getProvider,
    deriveWallets: deriveWallets,
    // toEthSignedMessageHash: toEthSignedMessageHash,
}

