const { signup, setPassword, login, mfa } = require('../controller/authController');

const router = require('express').Router();

router.post("/signup", signup);
router.post("/set-password", setPassword);
router.post("/login", login);
router.post("/verify", mfa)

module.exports = router;