const mongoose = require('mongoose');

const personalizationSchema = new mongoose.Schema({
  useruid: {
    type: String,
    required: true,
    unique: true,
  },
  personalisedName: {
    type: String,
    default: 'intellect',
  },
  modelBehaviour: {
    type: String,
    default: '',
  },
  personalInfo: {
    type: String,
    default: '',
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

personalizationSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Personalization = mongoose.model('Personalization', personalizationSchema);

module.exports = Personalization;