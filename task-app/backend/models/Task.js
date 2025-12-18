const mongoose = require('mongoose');

const taskSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User', // Links task to a specific user
  },
  title: { type: String, required: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['todo', 'in-progress', 'done'],
    default: 'todo' 
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Task', taskSchema);