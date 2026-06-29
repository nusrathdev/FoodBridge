const express = require('express');
const router = express.Router();
const {
    createFoodPost, listFoodPosts, getFoodPost, updateFoodPost
} = require('../controllers/foodpost.controller');
const { createFoodPostValidator } = require('../validators/foodpost.validator');
const { verifyToken, requireRole } = require('../middleware/auth');

router.post('/', verifyToken, requireRole('donor'), createFoodPostValidator, createFoodPost);
router.get('/', verifyToken, requireRole('donor', 'admin'), listFoodPosts);
router.get('/:id', verifyToken, requireRole('donor', 'admin'), getFoodPost);
router.patch('/:id', verifyToken, requireRole('donor'), updateFoodPost);

module.exports = router;