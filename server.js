// BadgerFit - server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// Serve all your HTML/CSS/JS files statically from the project root
app.use(express.static(path.join(__dirname)));

// Routes
app.use('/api/match', require('./routes/match'));
app.use('/api/gyms',  require('./routes/gyms'));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ BadgerFit server running at http://localhost:${PORT}`);
});








































