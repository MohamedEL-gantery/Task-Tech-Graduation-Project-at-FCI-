const express = require('express');
const authFront = require('../services/authFornt');

const router = express.Router();

router.post('/register', authFront.signup);

module.exports = router;
