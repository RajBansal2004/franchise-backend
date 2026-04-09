const multer = require('multer');

const storage = multer.memoryStorage(); // ⚠️ IMPORTANT

const uploadKyc = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = uploadKyc;