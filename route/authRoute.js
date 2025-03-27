const { signup, setPassword, login } = require('../controller/authController');

const router = require('express').Router();

router.post("/signup", signup);
router.post("/set-password", setPassword);
router.post("/login", login);

module.exports = router;