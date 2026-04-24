const express = require('express');
const router = express.Router();
const { getPatients, getMyPatients, linkPatient, updateProfile } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.get('/patients', protect, getPatients);
router.get('/my-patients', protect, getMyPatients);
router.post('/link-patient', protect, linkPatient);
router.put('/profile', protect, updateProfile);

module.exports = router;
