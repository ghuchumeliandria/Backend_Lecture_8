const fs = require("fs/promises");

const readFileAndParse = async (filepath, file) => {
  if (!filepath) return;

  const products = await fs.readFile(filepath, "utf-8");

  return file ? JSON.parse(products) : products;
};

module.exports = readFileAndParse;
