const express = require('express');
const router = express.Router();
const { 
    getPatientMedicines, 
    getMyMedicines, 
    getMedicineById, 
    addMedicine, 
    updateMedicine, 
    deleteMedicine 
} = require('../controllers/medicineController');
const { protect } = require('../middleware/auth');

router.get('/patient/:patientId', protect, getPatientMedicines);
router.get('/', protect, getMyMedicines);
router.get('/:id', protect, getMedicineById);
router.post('/', protect, addMedicine);
router.put('/:id', protect, updateMedicine);
router.delete('/:id', protect, deleteMedicine);

module.exports = router;
