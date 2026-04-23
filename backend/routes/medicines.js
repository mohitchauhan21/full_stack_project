const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Medicine = require('../models/Medicine');
const User = require('../models/User');

// @route    GET api/medicines/patient/:patientId
// @desc     Get medicines for a specific patient
// @access   Private (Doctor/Caregiver)
router.get('/patient/:patientId', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        // Check if doctor or if caregiver is linked to this patient
        if (user.role === 'doctor' || (user.role === 'caregiver' && user.patientIds.includes(req.params.patientId))) {
            const medicines = await Medicine.find({ user: req.params.patientId }).sort({ date: -1 });
            return res.json(medicines);
        }
        res.status(403).json({ msg: 'Access denied' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route    GET api/medicines
// @desc     Get all medicines for logged-in user
// @access   Private
router.get('/', protect, async (req, res) => {
    try {
        const medicines = await Medicine.find({ user: req.user.id }).sort({ date: -1 });
        res.json(medicines);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route    GET api/medicines/:id
// @desc     Get single medicine by ID
// @access   Private
router.get('/:id', protect, async (req, res) => {
    try {
        const medicine = await Medicine.findById(req.params.id);

        if (!medicine) {
            return res.status(404).json({ msg: 'Medicine not found' });
        }

        // Make sure user owns this medicine
        if (medicine.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        res.json(medicine);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Medicine not found' });
        }
        res.status(500).send('Server error');
    }
});

// @route    POST api/medicines
// @desc     Add a new medicine
// @access   Private
router.post('/', protect, async (req, res) => {
    try {
        const { name, dosage, time, frequency, user: targetUserId } = req.body;

        if (!name || !time) {
            return res.status(400).json({ msg: 'Name and time are required' });
        }

        // Doctors can assign to a patient; everyone else assigns to themselves
        const requestingUser = await User.findById(req.user.id);
        let assignToUser = req.user.id;
        if (requestingUser.role === 'doctor' && targetUserId) {
            assignToUser = targetUserId;
        }

        const newMedicine = new Medicine({
            user: assignToUser,
            name,
            dosage: dosage || '',
            time,
            frequency: frequency || 'daily',
        });

        const medicine = await newMedicine.save();
        res.status(201).json(medicine);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route    PUT api/medicines/:id
// @desc     Update a medicine
// @access   Private
router.put('/:id', protect, async (req, res) => {
    try {
        let medicine = await Medicine.findById(req.params.id);

        if (!medicine) {
            return res.status(404).json({ msg: 'Medicine not found' });
        }

        // Make sure user owns this medicine
        if (medicine.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const { name, dosage, time, frequency } = req.body;
        const updateFields = {};
        if (name) updateFields.name = name;
        if (dosage !== undefined) updateFields.dosage = dosage;
        if (time) updateFields.time = time;
        if (frequency) updateFields.frequency = frequency;

        medicine = await Medicine.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true }
        );

        res.json(medicine);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Medicine not found' });
        }
        res.status(500).send('Server error');
    }
});

// @route    DELETE api/medicines/:id
// @desc     Delete a medicine
// @access   Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const medicine = await Medicine.findById(req.params.id);

        if (!medicine) {
            return res.status(404).json({ msg: 'Medicine not found' });
        }

        // Make sure user owns this medicine
        if (medicine.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await Medicine.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Medicine removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Medicine not found' });
        }
        res.status(500).send('Server error');
    }
});

module.exports = router;
