const express = require('express');
const router = express.Router();
const transporteController = require('../controllers/transporteController');
const verificarToken = require('../middlewares/authMiddleware');


router.post('/transportes', transporteController.criarTransporte);

router.get('/admin/transportes', verificarToken, transporteController.listarTransportesAdmin);
router.put('/admin/transportes/:id', verificarToken, transporteController.atualizarTransporteAdmin);

module.exports = router;