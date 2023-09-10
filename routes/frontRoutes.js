const express = require('express');
const authFront = require('../Auth/authFornt');

const router = express.Router();

router.route('/register').post(authFront.signup);

module.exports = router;
