const express = require('express');
const router = express.Router();
const transporteController = require('../controllers/transporteController');

// Rotas do Cliente
router.post('/transportes', transporteController.criarTransporte);

// Rotas do Admin
router.get('/admin/transportes', transporteController.listarTransportesAdmin);
router.put('/admin/transportes/:id', transporteController.atualizarTransporteAdmin);

module.exports = router;