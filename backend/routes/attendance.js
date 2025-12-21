const express = require('express');
const router = express.Router();

// TEMPORARY - for browser testing
router.get('/upload', (req, res) => {
  res.json({ message: 'GET /upload works (but real endpoint is POST)' });
});

router.post('/upload', (req, res) => {
  res.json({ message: 'POST /upload endpoint working!' });
});

module.exports = router;
