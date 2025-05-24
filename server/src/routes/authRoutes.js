const express = require('express');
const router = express.Router();
const { signUp, signIn, signOut, getCurrentUser } = require('../controllers/authController');
const { authenticateUser } = require('../middleware/auth');

// Public routes
router.post('/signup', signUp);
router.post('/signin', signIn);
router.post('/signout', signOut);

// Protected routes
router.get('/me', authenticateUser, getCurrentUser);

module.exports = router; 