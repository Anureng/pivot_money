const express = require('express');
const cors = require('cors');
const config = require('./config');
const portfolioRoutes = require('./routes/portfolio.routes');
const logger = require('./utils/logger');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/portfolio', portfolioRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Using a fallback port if config.port is not defined correctly
const PORT = config.port || 3000;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

module.exports = app;
