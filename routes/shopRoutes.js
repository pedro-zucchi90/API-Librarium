const express = require('express');
const { autenticarUsuario } = require('../middleware/auth');
const Usuario = require('../models/User');
const shopController = require('../controllers/shopController');

const router = express.Router();

// ===== LOJA =====
// Loja de skins e itens cosméticos
const lojaItens = [
  { id: 'skin1', nome: 'Manto Sombrio', tipo: 'armadura', precoXP: 100 },
  { id: 'skin2', nome: 'Espada Fantasma', tipo: 'arma', precoXP: 150 },
  { id: 'skin3', nome: 'Amuleto Abissal', tipo: 'acessorio', precoXP: 80 },
  { id: 'skin4', nome: 'Manto Lendário', tipo: 'armadura', precoXP: 300 }
];

router.get('/', autenticarUsuario, shopController.listarItens);
router.post('/comprar', autenticarUsuario, shopController.comprar);

module.exports = router;
