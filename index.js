const axios = require('axios');
const { Identities, Transactions } = require('@arkecosystem/crypto');
const bip39 = require('bip39');

const DEFAULT_API_MAX_PAGE_SIZE = 100;

class ArkAdapter {
  constructor(options) {
    this.apiURL = options.apiURL;
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
    return await bip39.generateMnemonic();
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

  async getLatestOutboundTransactions({
    address,
    limit = DEFAULT_API_MAX_PAGE_SIZE,
  }) {
    return (
      await axios.get(
        `${this.apiURL}/transactions?senderId=${address}&limit=${limit}&page=1`,
      )
    ).data.data;
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
