const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB (skip for now - use later)
mongoose.connect('mongodb://localhost:27017/leaveanalyzer')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB not connected:', err.message));

// Routes
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
