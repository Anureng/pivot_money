const fs = require('fs/promises');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Reads JSON files from the filesystem.
 */
const readJsonFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      logger.warn(`File not found: ${filePath}. Returning empty array.`);
      return [];
    }
    logger.error(`Error reading or parsing file: ${filePath}`, error);
    throw error;
  }
};

const getRawData = async () => {
  const [orderData, mfData, aaData] = await Promise.all([
    readJsonFile(config.dataPaths.order),
    readJsonFile(config.dataPaths.mfCentral),
    readJsonFile(config.dataPaths.accountAggregator)
  ]);

  return {
    orderData,
    mfData,
    aaData
  };
};

module.exports = {
  getRawData
};
