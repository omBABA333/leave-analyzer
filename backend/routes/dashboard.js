const express = require('express');
const router = express.Router();

router.get('/:month/:employeeId', (req, res) => {
  res.json({ message: 'Dashboard endpoint working!' });
});

module.exports = router;
