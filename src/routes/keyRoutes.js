const express = require('express');
const router = express.Router();

const { 
    generateKey, 
    getAvailableKey, 
    getKeyInfo, 
    deleteKey, 
    unblockKey, 
    keepAlive 
} = require('../controllers/keyController');

router.post('/', generateKey );

router.get('/', getAvailableKey);

router.get('/:id', getKeyInfo);

router.delete('/:id', deleteKey);

router.put('/:id', unblockKey );

router.put('/:id/keepalive', keepAlive );

module.exports = router;



