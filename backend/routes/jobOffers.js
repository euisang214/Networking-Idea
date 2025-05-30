const express = require('express');
const router = express.Router();
const JobOfferController = require('../controllers/jobOfferController');
const authenticate = require('../middlewares/authenticate');

// All routes require authentication
router.use(authenticate);

// Report job offer
router.post('/report', JobOfferController.reportOffer);

// Confirm job offer
router.post('/:offerId/confirm', JobOfferController.confirmOffer);

// Get user's job offers
router.get('/me', JobOfferController.getMyOffers);

module.exports = router;