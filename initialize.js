const { User, Coin, Asset, Key } = require('./models');

const init = async () => {
  await User.deleteMany();
  await Asset.deleteMany();
  await Key.deleteMany();
  await Coin.deleteMany();

  const coins = [
    'bitcoin',
    'ripple',
    'dogecoin',
    'ethereum',
    'solana',
    'cardano',
  ];

  for (const _coin of coins) {
    const coin = new Coin({ name: _coin, isActive: true });
    await coin.save();
  }

  console.log('completed');
};
init();
