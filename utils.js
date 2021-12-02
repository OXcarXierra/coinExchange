const axios = require('axios');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { User, Key } = require('./models');

const encryptPassword = (password) => {
  return crypto.createHash('sha512').update(password).digest('base64');
};

//middleware: request의 인증에 대한 전처리
const setAuth = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization)
    return res.status(401).send({ error: 'Wrong Authorization' });
  const [bearer, token] = authorization.split(' ');
  if (bearer !== 'Bearer')
    return res.status(401).send({ error: 'Wrong Authorization' });
  const publicKey = jwt.decode(token).publicKey;
  const foundKey = await Key.findOne({ publicKey });
  const secretKey = foundKey.secretKey;
  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.send({ error: err }).status(401);
    }
  });
  const key = await Key.findOne({ publicKey: token });
  const user = await User.findOne({ key });
  if (!user) return res.send({ error: 'User Not Found' }).status(404);
  req.user = user;
  return next();
};

const getCoinPrice = async (coinName) => {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinName}&vs_currencies=usd`;
  const apiRes = await axios.get(url);
  if (!apiRes.data[coinName]) return null;
  const price = apiRes.data[coinName].usd;
  return price;
};

module.exports = {
  encryptPassword,
  setAuth,
  getCoinPrice,
};
