const express = require('express');
const {
    registerUser,
    loginUser,
    logoutUser,
    getProfile,
    createOrganization,
    acceptOrganizationInvite,
    declineOrganizationInvite,
    getPendingUserInvites
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

// Route: /api/v1/auth/organization
router.post('/organization', protect, createOrganization);

// Route: /api/v1/auth/invites/pending
router.get('/invites/pending', protect, getPendingUserInvites);

// Route: /api/v1/auth/invites/:inviteId/accept
router.post('/invites/:inviteId/accept', protect, acceptOrganizationInvite);

// Route: /api/v1/auth/invites/:inviteId/decline
router.post('/invites/:inviteId/decline', protect, declineOrganizationInvite);

module.exports = router;

