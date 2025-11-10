const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Criar diretório de uploads se não existir
const uploadDir = path.join(__dirname, '../uploads/perfis');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração de armazenamento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Nome do arquivo: userId_timestamp.extensao
    const userId = req.usuario?._id || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${userId}_${timestamp}${ext}`);
  }
});

// Filtro de arquivos - apenas imagens
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  // Verificar mimetype (pode ser undefined em alguns casos)
  let mimetypeValid = false;
  if (file.mimetype) {
    mimetypeValid = allowedTypes.test(file.mimetype);
  }
  
  // Aceitar se a extensão for válida OU se o mimetype for válido
  // Isso permite que arquivos sem mimetype correto mas com extensão válida sejam aceitos
  if (extname || mimetypeValid) {
    console.log(`Arquivo aceito: ${file.originalname}, mimetype: ${file.mimetype || 'não fornecido'}, extensão: ${path.extname(file.originalname)}`);
    return cb(null, true);
  } else {
    console.log(`Arquivo rejeitado: ${file.originalname}, mimetype: ${file.mimetype || 'não fornecido'}, extensão: ${path.extname(file.originalname)}`);
    cb(new Error('Apenas imagens são permitidas! (jpeg, jpg, png, gif, webp)'));
  }
};

// Middleware para tratamento de erros do multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        erro: 'Arquivo muito grande',
        mensagem: 'A imagem deve ter no máximo 5MB'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        erro: 'Muitos arquivos',
        mensagem: 'Apenas uma imagem por vez é permitida'
      });
    }
    return res.status(400).json({
      erro: 'Erro no upload',
      mensagem: err.message || 'Erro ao processar o arquivo'
    });
  }
  
  if (err) {
    // Erro do fileFilter
    if (err.message && err.message.includes('Apenas imagens')) {
      return res.status(400).json({
        erro: 'Tipo de arquivo inválido',
        mensagem: 'Apenas imagens são permitidas! (jpeg, jpg, png, gif, webp)'
      });
    }
    
    return res.status(400).json({
      erro: 'Erro no upload',
      mensagem: err.message || 'Erro ao processar o arquivo'
    });
  }
  
  next();
};

// Configuração do multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

module.exports = {
  upload,
  handleMulterError
};

