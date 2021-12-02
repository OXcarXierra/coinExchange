const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  name: String,
  email: { type: String, unique: true }, // unique는 데이터베이스에 중복된 값이 오지 못하도록 함
  password: String,
  keys: [{ type: Schema.Types.ObjectId, ref: 'Key' }],
  assets: [{ type: Schema.Types.ObjectId, ref: 'Asset' }],
  //   token: String,
});

const User = mongoose.model('User', userSchema);

module.exports = User;
