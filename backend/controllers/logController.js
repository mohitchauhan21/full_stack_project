const Log = require('../models/Log');
const Medicine = require('../models/Medicine');

// @desc     Get all logs for a specific patient
// @route    GET api/logs/patient/:userId
// @access   Private (Doctor/Caregiver)
exports.getPatientLogs = async (req, res) => {
    try {
        const logs = await Log.find({ user: req.params.userId })
            .populate('medicine', 'name dosage time')
            .sort({ date: -1 });
        res.json(logs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc     Get log stats for last 7 days
// @route    GET api/logs/stats/:userId
// @access   Private
exports.getLogStats = async (req, res) => {
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
};

// @desc     Get all logs for logged-in user
// @route    GET api/logs
// @access   Private
exports.getMyLogs = async (req, res) => {
    try {
        const logs = await Log.find({ user: req.user.id })
            .populate('medicine', 'name dosage time')
            .sort({ date: -1 });
        res.json(logs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc     Create a new log entry
// @route    POST api/logs
// @access   Private
exports.createLog = async (req, res) => {
    try {
        const { medicineId, status } = req.body;
        if (!medicineId) return res.status(400).json({ msg: 'Medicine ID is required' });

        const medicine = await Medicine.findById(medicineId);
        if (!medicine) return res.status(404).json({ msg: 'Medicine not found' });
        
        if (medicine.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // Duplicate prevention: one log per medicine per day
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const existing = await Log.findOne({
            user: req.user.id,
            medicine: medicineId,
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        if (existing) return res.status(400).json({ msg: 'Already logged for today' });

        const newLog = new Log({
            user: req.user.id,
            medicine: medicineId,
            status: status || 'taken',
        });

        const log = await newLog.save();
        await log.populate('medicine', 'name dosage time');
        res.status(201).json(log);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc     Delete a log entry
// @route    DELETE api/logs/:id
// @access   Private
exports.deleteLog = async (req, res) => {
    try {
        const log = await Log.findById(req.params.id);
        if (!log) return res.status(404).json({ msg: 'Log not found' });

        if (log.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await Log.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Log removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
