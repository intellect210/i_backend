const mongoose = require('mongoose');

const backendStatusSchema = new mongoose.Schema({
  status: {
    type: Boolean,
    required: true,
    default: false,
  },
  message: {
    type: String,
    default: "",
  },
}, { timestamps: true }); // Add timestamps (createdAt, updatedAt)

const BackendStatus = mongoose.model('BackendStatus', backendStatusSchema);

module.exports = BackendStatus;