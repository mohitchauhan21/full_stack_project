const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// @route    GET api/users/patients
// @desc     Get all patients (for Doctors)
// @access   Private (Doctor only)
router.get('/patients', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.role !== 'doctor') {
            return res.status(403).json({ msg: 'Access denied' });
        }
        const patients = await User.find({ role: 'patient' }).select('-password');
        res.json(patients);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route    GET api/users/my-patients
// @desc     Get patients linked to caregiver
// @access   Private (Caregiver only)
router.get('/my-patients', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('patientIds', '-password');
        if (user.role !== 'caregiver') {
            return res.status(403).json({ msg: 'Access denied' });
        }
        res.json(user.patientIds);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route    POST api/users/link-patient
// @desc     Link a patient to caregiver by email
// @access   Private (Caregiver only)
router.post('/link-patient', protect, async (req, res) => {
    try {
        const { email } = req.body;
        const caregiver = await User.findById(req.user.id);
        if (caregiver.role !== 'caregiver') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const patient = await User.findOne({ email, role: 'patient' });
        if (!patient) {
            return res.status(404).json({ msg: 'Patient not found' });
        }

        if (caregiver.patientIds.includes(patient._id)) {
            return res.status(400).json({ msg: 'Patient already linked' });
        }

        caregiver.patientIds.push(patient._id);
        await caregiver.save();
        res.json(caregiver.patientIds);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route    PUT api/users/profile
// @desc     Update logged-in user's profile (name, age)
// @access   Private
router.put('/profile', protect, async (req, res) => {
    try {
        const { name, age } = req.body;
        const updateFields = {};
        if (name) updateFields.name = name.trim();
        if (age) updateFields.age = parseInt(age);

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateFields },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
