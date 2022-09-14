const axios = require('axios');
const { Identities, Transactions, Managers } = require('@arkecosystem/crypto');
const bip39 = require('bip39');

const DEFAULT_API_MAX_PAGE_SIZE = 100;
const DEFAULT_API_URL = 'https://api.ark.io/api';

class ArkAdapter {
  constructor(options) {
    this.apiURL = options.apiURL || DEFAULT_API_URL;
    this.apiMaxPageSize = options.apiMaxPageSize || DEFAULT_API_MAX_PAGE_SIZE;

    // Needs to be set to a height which supports version 2 transactions.
    Managers.configManager.setHeight(20000000);
  }

  async connect({ passphrase }) {
    this.passphrase = passphrase;
    this.address = Identities.Address.fromPassphrase(passphrase);
    this.publicKey = Identities.PublicKey.fromPassphrase(passphrase);
    this.nonce = null;
  }

  async disconnect() {}

  async updateNonce() {
    try {
      const accountNonce = await this.getNonce({ address: this.address })
      if (this.nonce == null || accountNonce > this.nonce) {
        this.nonce = accountNonce;
      }
    } catch (error) {
      if (
        error.name === 'AccountNotFoundError' ||
        (error.response && error.response.status === 404)
      ) {
        this.nonce = 0;
      } else {
        throw error;
      }
    }
  }

  async createTransfer({ amount, recipientAddress, message, fee, timestamp }) {
    await this.updateNonce();
    const transferBuilder = Transactions.BuilderFactory.transfer();

    const transaction = transferBuilder
      .version(2)
      .nonce(++this.nonce)
      .amount(amount)
      .fee(fee)
      .senderPublicKey(this.publicKey)
      .recipientId(recipientAddress)
      // Convert unix to epoch
      .timestamp(Math.round((timestamp == null ? Date.now() : timestamp) / 1000))
      .vendorField(message)
      .build();

    const privateKey = Identities.PrivateKey.fromPassphrase(this.passphrase);

    Transactions.Signer.sign(transaction.data, {
      publicKey: this.publicKey,
      privateKey,
    });

    // Serialize it for the Ark DEX adapter.
    transaction.data.senderAddress = transaction.data.senderId;
    transaction.data.recipientAddress = transaction.data.recipientId;
    transaction.data.amount = transaction.data.amount.toString();
    transaction.data.fee = transaction.data.fee.toString();
    transaction.data.message = transaction.data.vendorField || '';
    transaction.data.nonce = transaction.data.nonce.toString();

    return transaction.data;
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
    await axios.post(`${this.apiURL}/transactions`, { transactions: [transaction] });
  }

  async getAccountNextKeyIndex({ address }) {
    return this.getNonce({ address });
  }

  async getAccountBalance({ address }) {
    const account = await this.getAccount(address);
    return account.balance;
  }

  async getAccount(address) {
    const account = (await axios.get(`${this.apiURL}/wallets?address=${address}`)).data.data[0];
    if (!account) {
      const error = new Error(`Failed to fetch account with address ${address}`);
      error.name = 'AccountNotFoundError';
      throw error;
    }
    return account;
  }

  async getNonce({ address }) {
    const account = await this.getAccount(address);
    return Number(account.nonce || '0');
  }
}

module.exports = ArkAdapter;
