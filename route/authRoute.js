const { signup } = require('../controller/authController');

const router = require('express').Router();

router.post("/signup", signup);

module.exports = router;