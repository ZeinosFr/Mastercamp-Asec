const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

// Simule une réponse de statut OPNsense
app.get('/api/status/opnsense', (req, res) => {
  res.json({
    service: 'OPNsense',
    online: true,
    firewallRules: 82,
    suricataAlerts: 3,
    lastRestart: '2025-07-01 14:22'
  });
});

// Tu peux ajouter /api/status/ntopng et /truenas plus tard

app.listen(PORT, () => {
  console.log(`API démarrée sur http://localhost:${PORT}`);
});

