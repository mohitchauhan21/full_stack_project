const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    name: { type: String, required: true },
    dosage: { type: String },
    time: { type: String, required: true },
    frequency: { type: String },
    status: { type: String, enum: ['active', 'on hold', 'completed'], default: 'active' },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('medicine', MedicineSchema);
