const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Vitals = require('../models/Vitals');

// @route    GET api/vitals
// @desc     Get all vitals for logged in user
// @access   Private
router.get('/', protect, async (req, res) => {
    try {
        const vitals = await Vitals.find({ user: req.user.id }).sort({ date: -1 });
        res.json(vitals);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route    POST api/vitals
// @desc     Add new vitals entry
// @access   Private
router.post('/', protect, async (req, res) => {
    try {
        const { heartRate, bloodPressure, weight } = req.body;
        const newVitals = new Vitals({
            user: req.user.id,
            heartRate,
            bloodPressure,
            weight
        });
        const vitals = await newVitals.save();
        res.json(vitals);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route    GET api/vitals/stats/:userId
// @desc     Get vitals for a specific user (for caregivers/doctors)
// @access   Private
router.get('/stats/:userId', protect, async (req, res) => {
    try {
        const vitals = await Vitals.find({ user: req.params.userId }).sort({ date: -1 }).limit(10);
        res.json(vitals);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
