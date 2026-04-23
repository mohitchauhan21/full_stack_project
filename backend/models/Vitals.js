const mongoose = require('mongoose');

const VitalsSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    heartRate: { type: Number },
    bloodPressure: {
        systolic: { type: Number },
        diastolic: { type: Number }
    },
    weight: { type: Number },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('vitals', VitalsSchema);
