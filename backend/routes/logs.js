const express = require('express');
const router = express.Router();
const { 
    getPatientLogs, 
    getLogStats, 
    getMyLogs, 
    createLog, 
    deleteLog 
} = require('../controllers/logController');
const { protect } = require('../middleware/auth');

router.get('/patient/:userId', protect, getPatientLogs);
router.get('/stats/:userId', protect, getLogStats);
router.get('/', protect, getMyLogs);
router.post('/', protect, createLog);
router.delete('/:id', protect, deleteLog);

module.exports = router;
