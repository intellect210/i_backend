// FILE: models/feedbackModel.js
const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  feedback: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;