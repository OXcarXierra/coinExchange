const mongoose = require('mongoose');
const { Schema } = mongoose;

const keySchema = new Schema({
  publicKey: String,
  secretKey: String,
  user: { type: Schema.Types.ObjectId, ref: 'User' },
});

const Key = mongoose.model('Key', keySchema);

module.exports = Key;
