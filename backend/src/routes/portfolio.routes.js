const express = require('express');
const router = express.Router();
const parserService = require('../services/parser.service');
const normalizeService = require('../services/normalize.service');
const dedupeService = require('../services/dedupe.service');
const portfolioService = require('../services/portfolio.service');
const logger = require('../utils/logger');

router.get('/', async (req, res) => {
  try {
    logger.info('Fetching portfolio data...');

    // 1. Read Raw Data
    const { orderData, mfData, aaData } = await parserService.getRawData();

    // 2. Normalize
    const normalizedData = normalizeService.normalizeAll(aaData, mfData, orderData);

    // 3. Deduplicate
    const deduplicatedData = dedupeService.deduplicate(normalizedData);

    // 4. Calculate Portfolio
    const portfolio = portfolioService.calculatePortfolio(deduplicatedData);

    // 5. Extract User Info
    let userName = 'Demo User';
    if (orderData && orderData.length > 0 && orderData[0].ucc_full_name) {
      userName = orderData[0].ucc_full_name.trim();
    }
    portfolio.userInfo = { name: userName };

    logger.info('Portfolio data successfully generated');
    res.json(portfolio);

  } catch (error) {
    logger.error('Failed to generate portfolio', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
