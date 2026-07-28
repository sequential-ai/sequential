const express = require('express');
const {
    registerUser,
    loginUser,
    logoutUser,
    getProfile
} = require('../../controllers/auth.controller');
const { protect } = require('../../middlewares/auth.middleware');

const router = express.Router();

// Route: /api/v1/auth/register
router.post('/register', registerUser);

// Route: /api/v1/auth/login
router.post('/login', loginUser);

// Route: /api/v1/auth/logout
router.post('/logout', logoutUser);

// Route: /api/v1/auth/me
router.get('/me', protect, getProfile);

module.exports = router;
