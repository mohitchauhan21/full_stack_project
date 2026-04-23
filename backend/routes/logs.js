const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Log = require('../models/Log');
const Medicine = require('../models/Medicine');

// @route    GET api/logs/patient/:userId
// @desc     Get all logs for a specific patient
// @access   Private (Doctor/Caregiver)
router.get('/patient/:userId', protect, async (req, res) => {
    try {
        const logs = await Log.find({ user: req.params.userId })
            .populate('medicine', 'name dosage time')
            .sort({ date: -1 });
        res.json(logs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route    GET api/logs/stats/:userId
// @desc     Get log stats for last 7 days
// @access   Private
router.get('/stats/:userId', protect, async (req, res) => {
    try {
        const userId = req.params.userId;
        const stats = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0,0,0,0);
            
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);

            const dayLogs = await Log.find({
                user: userId,
                date: { $gte: date, $lt: nextDay }
            });

            const taken = dayLogs.filter(l => l.status === 'taken').length;
            const total = dayLogs.length;
            
            stats.push({
                day: date.toLocaleDateString([], { weekday: 'short' }),
                percentage: total > 0 ? Math.round((taken / total) * 100) : 0
            });
        }
        
        res.json(stats);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route    GET api/logs
// @desc     Get all logs for logged-in user (with medicine details)
// @access   Private
router.get('/', protect, async (req, res) => {
    try {
        const logs = await Log.find({ user: req.user.id })
            .populate('medicine', 'name dosage time')
            .sort({ date: -1 });
        res.json(logs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route    POST api/logs
// @desc     Create a new log entry (taken / skipped)
// @access   Private
router.post('/', protect, async (req, res) => {
    try {
        const { medicineId, status } = req.body;

        if (!medicineId) {
            return res.status(400).json({ msg: 'Medicine ID is required' });
        }

        // Verify the medicine exists and belongs to the user
        const medicine = await Medicine.findById(medicineId);
        if (!medicine) {
            return res.status(404).json({ msg: 'Medicine not found' });
        }
        if (medicine.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const newLog = new Log({
            user: req.user.id,
            medicine: medicineId,
            status: status || 'taken',
        });

        const log = await newLog.save();

        // Populate medicine details before returning
        await log.populate('medicine', 'name dosage time');

        res.status(201).json(log);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route    DELETE api/logs/:id
// @desc     Delete a log entry
// @access   Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const log = await Log.findById(req.params.id);

        if (!log) {
            return res.status(404).json({ msg: 'Log not found' });
        }

        if (log.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await Log.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Log removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Log not found' });
        }
        res.status(500).send('Server error');
    }
});

module.exports = router;
