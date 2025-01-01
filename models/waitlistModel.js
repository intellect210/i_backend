// FILE: models/waitlistModel.js
const mongoose = require('mongoose');

const waitlistSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /@gmail\.com$/.test(v);
      },
      message: props => `${props.value} is not a valid @gmail.com email address!`
    }
  },
  accessGranted: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Waitlist = mongoose.model('Waitlist', waitlistSchema);

module.exports = Waitlist;