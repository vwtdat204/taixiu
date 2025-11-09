const express = require('express');
const router = express.Router();
const auth = require('../auth');
const { placeBet, getProfile } = require('../controllers/gameController');

router.post('/bet', auth, placeBet);
router.get('/profile', auth, getProfile);

module.exports = router;
