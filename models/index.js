const mongoose = require('mongoose');

const User = require('./User');
const Coin = require('./Coin');
const Asset = require('./Asset');
const Key = require('./Key');

const mongoURL =
  'mongodb+srv://test0:1234@testmongo.r21jj.mongodb.net/coinServer?retryWrites=true&w=majority';
mongoose.connect(mongoURL);

module.exports = {
  User,
  Coin,
  Asset,
  Key,
};
