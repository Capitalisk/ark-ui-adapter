const ArkAdapter = require('./index.js');

/**
 * DRzgcj97d3hFdLJjYhPTdBQNVeb92mzrx5 warfare grocery replace donor park void begin math woman latin body life
 * DRFp1KVCuCMFLPFrHzbH8eYdPUoNwTXWzV First signature: eternal shrimp catch pause giraffe yard hat day pull august brush sign apple strategy clutch animal heavy escape car walk juice umbrella pluck must
 * DRFp1KVCuCMFLPFrHzbH8eYdPUoNwTXWzV Second signature: discover security nominee submit loyal zoo outer tag bag cushion grass lunch rigid credit join gather nerve resource drill hold brisk network impact cool
 * Multisig wallet DMwCauULKf1edh4WVTYVEfZt9CouMqxDuV
 */

const adapter = new ArkAdapter({
  apiURL: 'https://dapi.ark.io/api',
});

(async () => {
  await adapter.connect({
    passphrase:
      'warfare grocery replace donor park void begin math woman latin body life',
  });

  const { passphrase, address } = await adapter.createWallet();

  console.log(passphrase);
  console.log(await adapter.getAddressFromPassphrase({ passphrase }));
  console.log(adapter.validatePassphrase({ passphrase }));
  console.log(
    await adapter.getLatestOutboundTransactions({
      address: 'DRFp1KVCuCMFLPFrHzbH8eYdPUoNwTXWzV',
    }),
  );
  console.log(
    await adapter.getAccountNextKeyIndex({
      address: 'DRFp1KVCuCMFLPFrHzbH8eYdPUoNwTXWzV',
    }),
  );
  console.log(
    await adapter.getAccountBalance({
      address: 'DRFp1KVCuCMFLPFrHzbH8eYdPUoNwTXWzV',
    }),
  );
})();
