const express = require('express');
const router = express.Router();
const { getMyVitals, addVitals, getPatientVitals } = require('../controllers/vitalsController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getMyVitals);
router.post('/', protect, addVitals);
router.get('/stats/:userId', protect, getPatientVitals);

module.exports = router;
