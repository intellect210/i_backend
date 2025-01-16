const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reminderSchema = new Schema({
  userId: {
    type: String,
    required: true,
  },
  reminderId: {
    type: String,
    required: true,
    unique: true,
  },
  taskDescription: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  recurrence: {
    type: Object,
    nullable: true,
  },
   status: {
    type: String,
    enum: ['scheduled', 'completed', 'failed', 'cancelled'],
    default: 'scheduled',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Reminder = mongoose.model('Reminder', reminderSchema);

module.exports = Reminder;