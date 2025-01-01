const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const agentTokenSchema = new Schema({
  _id: {
    type: Schema.Types.ObjectId,
    required: true,
    auto: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User' // Correctly establishes a reference to the User model
  },
  encryptedAuthCode: {
    type: String,
  },
  encryptedRefreshToken: {
    type: String,
  },
  encryptedAccessToken: {
    type: String,
  },
});

const AgentToken = mongoose.model('AgentToken', agentTokenSchema);

module.exports = AgentToken;