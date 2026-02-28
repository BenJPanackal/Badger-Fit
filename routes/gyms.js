// routes/gyms.js
const express = require('express');
const router = express.Router();

let gyms;
try {
  gyms = require('../gyms.json');
} catch (e) {
  gyms = [];
}

router.get('/', (req, res) => {
  res.json(gyms);
});

module.exports = router;