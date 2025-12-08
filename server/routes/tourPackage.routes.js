const express = require('express');
const router = express.Router();
const tourPackageController = require('../controllers/tourPackageController');

router.get('/', tourPackageController.getAllTourPackages);
router.get('/:id', tourPackageController.getTourPackageById);
router.post('/', tourPackageController.createTourPackage);
router.put('/:id', tourPackageController.updateTourPackage);
router.delete('/:id', tourPackageController.deleteTourPackage);

module.exports = router;
