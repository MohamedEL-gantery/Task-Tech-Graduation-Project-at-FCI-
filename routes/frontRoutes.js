const express = require('express');
const authFront = require('../auth/authFornt');

const router = express.Router();

router.post('/register', authFront.signup);

module.exports = router;
