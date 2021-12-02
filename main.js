const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const { encryptPassword, setAuth, getCoinPrice } = require('./utils');
const { User, Coin, Asset, Key } = require('./models');

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
  console.log(req.headers);
  res.send(req.headers.authorization);
});

app.get('/coins', async (req, res) => {
  const coins = await Coin.find({ isActive: true });
  res.send(coins.map((coin) => coin.name));
});

app.post(
  '/register',
  body('email').isLength({ max: 100 }).isEmail(),
  body('name').isLength({ min: 4, max: 12 }).isAlphanumeric(),
  body('password').isLength({ min: 8, max: 16 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    const { name, email, password } = req.body;
    const encryptedPassword = encryptPassword(password);
    let user = null;
    try {
      user = new User({
        name: name,
        email: email,
        password: encryptedPassword,
      });
      await user.save();
    } catch (err) {
      if (err instanceof mongoose.Error.ValidationError) {
        return res.sendStatus({ error: 'email is duplicated' });
      }
    }
    const coins = await Coin.find({ isActive: true });
    //10000달러 지급
    const usdAsset = new Asset({ name: 'USD', balance: 10000, user });
    await usdAsset.save();
    for (const coin of coins) {
      const coinAsset = new Asset({ name: coin.name, balance: 0, user });
      await coinAsset.save();
    }
    res.send({});
  }
);

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const encryptedPassword = encryptPassword(password);
  const user = await User.findOne({ email, password: encryptedPassword });
  if (user === null) return res.status(400).send({ error: 'User Not Found' });
  const publicKey = encryptPassword(crypto.randomBytes(20));
  const secretKey = encryptPassword(crypto.randomBytes(20));
  const key = new Key({
    publicKey,
    secretKey,
    user: user,
  });
  await key.save();
  res.send({ key });
});

app.get('/balance', setAuth, async (req, res) => {
  const user = req.user;
  const assets = await Asset.find({ user });
  const sendJson = {};
  for (const asset of assets) {
    if (asset.balance) sendJson[asset.name] = asset.balance;
  }
  res.send(sendJson);
});

app.get('/coins/:coin_name', async (req, res) => {
  const coin_name = req.params.coin_name;
  const price = await getCoinPrice(coin_name);
  if (!price) return res.status(404).send({ errors: 'Coin Not Found' });
  return res.send({ price });
});

app.post('/coins/:coin_name/buy', setAuth, async (req, res) => {
  const coin_name = req.params.coin_name;
  const { quantity, all } = req.body;
  const user = req.user;
  const price = await getCoinPrice(coin_name);
  if (!price) return res.status(404).send({ errors: 'Coin Not Found' });
  let usdAssets = await Asset.findOne({ user, name: 'USD' });
  let coinAssets = await Asset.findOne({ user, name: coin_name });
  if (!all) {
    if (!Number.isInteger(quantity * 10000))
      return res.status(400).send({ errors: 'Too Many Digits' });
    if (usdAssets.balance < quantity * price)
      return res.status(400).send({ errors: 'Not Enough USD' });
    else {
      usdAssets.balance -= Number(quantity * price);
      coinAssets.balance += Number(quantity);
      await res.send({ price, quantity });
    }
  } else {
    const maxNumber = Math.floor((usdAssets.balance / price) * 10000) / 10000;
    usdAssets.balance -= Number(maxNumber * price);
    coinAssets.balance += Number(maxNumber);
    await res.send({ price, quantity: maxNumber });
  }
  await usdAssets.save();
  await coinAssets.save();
});

app.post('/coins/:coin_name/sell', setAuth, async (req, res) => {
  const coin_name = req.params.coin_name;
  const user = req.user;
  const { quantity, all } = req.body;
  const price = await getCoinPrice(coin_name);
  if (!price) return res.status(404).send({ errors: 'Coin Not Found' });
  const usdAsset = await Asset.findOne({ user, name: 'USD' });
  const coinAsset = await Asset.findOne({ user, name: coin_name });
  if (!all) {
    if (!Number.isInteger(quantity * 10000))
      return res.status(400).send({ errors: 'Too Many Digits' });
    if (coinAsset.balance < quantity)
      return res.status(400).send({ errors: 'Not Enough Coin' });
    else {
      usdAsset.balance += Number(quantity * price);
      coinAsset.balance -= Number(quantity);
      await res.send({ price, quantity });
    }
  } else {
    const maxNumber = Math.floor(coinAsset.balance * 10000) / 10000;
    coinAsset.balance -= maxNumber;
    usdAsset.balance += maxNumber * price;
    await res.send({ price, quantity: maxNumber });
  }
  usdAsset.save();
  coinAsset.save();
});

app.listen(port, () => {
  console.log(`listening at port: ${port}...`);
});
