const path = require('path');

module.exports = {
  dataPaths: {
    order: path.join(__dirname, '../data/order.json'),
    mfCentral: path.join(__dirname, '../data/mf_central.json'),
    accountAggregator: path.join(__dirname, '../data/finarkein_aa_transactions.json'),
  },
  port: process.env.PORT || 5000,
};
