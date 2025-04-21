const mongoose = require('mongoose');

// Define breakpoint schema (for use as a subdocument)
const breakpointSchema = new mongoose.Schema({
  time: {
    type: Number,
    required: true
  },
  note: {
    type: String,
    default: ''
  }
});

// Define main project schema
const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  videoUrl: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  breakpoints: {
    type: [breakpointSchema],
    default: []
  },
  notesText: {
    type: String,
    default: ''
  }
}, {
  timestamps: true // adds updatedAt field automatically
});

// Create and export the model
const Project = mongoose.model('Project', projectSchema);
module.exports = Project; 