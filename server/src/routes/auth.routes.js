const express = require('express');
const router = express.Router();
const { register, login, me } = require('../controllers/auth.controller');
const { registerValidator, loginValidator } = require('../validators/auth.validator');
const { verifyToken } = require('../middleware/auth');

router.post('/register', registerValidator, register);
router.post('/login',    loginValidator,    login);
router.get('/me',        verifyToken,       me);

module.exports = router;