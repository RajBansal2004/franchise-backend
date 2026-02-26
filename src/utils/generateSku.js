const Product = require("../models/Product");

const generateSku = async (title) => {
  const prefix = title
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 4)
    .toUpperCase();

  const count = await Product.countDocuments();

  return `${prefix}-${1000 + count + 1}`;
};

module.exports = generateSku;