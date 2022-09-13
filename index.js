const axios = require('axios');
const { Identities, Transactions } = require('@arkecosystem/crypto');
const bip39 = require('bip39');

const DEFAULT_API_MAX_PAGE_SIZE = 100;
const DEFAULT_API_URL = 'https://api.ark.io/api';
const ARK_TRANSFER_TYPES = {
  0: 'transfer',
  1: 'second signiture',
  2: 'delegate registration',
  3: 'vote',
  4: 'multisig registration',
  5: 'ipfs transaction',
  6: 'multipayment',
  7: 'delegate resignation',
  8: 'htlc',
  9: 'entitiy',
};

class ArkAdapter {
  constructor(options) {
    this.apiURL = options.apiURL || DEFAULT_API_URL;
    this.apiMaxPageSize = options.apiMaxPageSize || DEFAULT_API_MAX_PAGE_SIZE;
  }

  async connect({ passphrase }) {
    this.passphrase = passphrase;
    this.address = Identities.Address.fromPassphrase(passphrase);
    this.publicKey = Identities.PublicKey.fromPassphrase(passphrase);
    this.nonce = await this.getNonce({ address: this.address });
  }

  async disconnect() {}

  async createTransfer({ amount, recipientAddress, message, fee, timestamp }) {
    const transferBuilder = Transactions.BuilderFactory.transfer();

    const transaction = transferBuilder
      .version(2)
      .nonce(this.nonce)
      .amount(amount)
      .fee(fee)
      .senderPublicKey(this.publicKey)
      .recipientId(recipientAddress)
      // Convert unix to epoch
      .timestamp((timestamp == null ? Date.now() : timestamp) / 1000)
      .vendorField(message)
      .build();

    const privateKey = Identities.PrivateKey.fromPassphrase(this.passphrase);

    Transactions.Signer.sign(transaction, {
      publicKey: this.publicKey,
      privateKey,
    });

    return transaction;
  }

  async createWallet() {
    const passphrase = bip39.generateMnemonic();
    return {
      passphrase,
      address: await this.getAddressFromPassphrase({ passphrase }),
    };
  }

  async getAddressFromPassphrase({ passphrase }) {
    return Identities.Address.fromPassphrase(passphrase);
  }

  validatePassphrase({ passphrase }) {
    const address = Identities.Address.fromPassphrase(passphrase);
    return Identities.Address.validate(address);
  }

  async postTransaction({ transaction }) {
    await axios.post(`${this.apiURL}/transactions`, transaction);
  }

  async getAccountNextKeyIndex({ address }) {
    return await this.getNonce({ address });
  }

  async getAccountBalance({ address }) {
    return (await axios.get(`${this.apiURL}/wallets?address=${address}`)).data
      .data[0].balance;
  }

  async getNonce({ address }) {
    return (await axios.get(`${this.apiURL}/wallets/${address}`)).data.data
      .nonce;
  }
}

module.exports = ArkAdapter;
