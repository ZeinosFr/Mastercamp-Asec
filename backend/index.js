
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const ntopngRoutes = require('./routes/ntopng');
app.use('/api/ntopng', ntopngRoutes);

const TRUENAS_HOST = process.env.TRUENAS_HOST;
const TRUENAS_TOKEN = process.env.TRUENAS_TOKEN;

app.get('/api/truenas/disks', async (req, res) => {
  try {
    const response = await axios.get(`${TRUENAS_HOST}/pool`, {
      headers: { Authorization: TRUENAS_TOKEN }
    });

    const pools = response.data.map(pool => ({
      nom: pool.name,
      taille: pool.size,
      utilisé: pool.allocated,
      libre: pool.free,
      statut: pool.status,
      santé: pool.status_code
    }));

    res.json(pools);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Impossible de contacter TrueNAS" });
  }
});

app.get('/api/truenas/datasets', async (req, res) => {
  try {
    const resp = await axios.get(`${TRUENAS_HOST}/zfs/dataset`, {
      headers: { Authorization: TRUENAS_TOKEN }
    });
    res.json(resp.data.map(d => d.name));
  } catch (err) {
    res.status(500).json({ error: "Erreur datasets TrueNAS" });
  }
});


app.get('/api/truenas/snapshots', async (req, res) => {
  try {
    const response = await axios.get(`${TRUENAS_HOST}/zfs/snapshot`, {
      headers: { Authorization: TRUENAS_TOKEN }
    });
    res.json(response.data);
  } catch (err) {
    console.error("Erreur snapshots:", err.message);
    res.status(500).json({ error: "Impossible de récupérer les snapshots" });
  }
});

app.post('/api/truenas/snapshot', async (req, res) => {
  const { dataset, name } = req.body;
  console.log('Création snapshot pour :', dataset, name);

  if (!dataset || !name) {
    return res.status(400).json({ error: "dataset et name requis" });
  }

  try {
    const response = await axios.post(`${TRUENAS_HOST}/zfs/snapshot`, {
      dataset,
      name
    }, {
      headers: {
        Authorization: TRUENAS_TOKEN,
        'Content-Type': 'application/json'
      },
      validateStatus: () => true // accepte tous les codes pour les traiter nous-même
    });

    // Si déjà existant
    if (response.status === 422 && response.data?.message?.includes("already exists")) {
      console.log("⚠️ Snapshot déjà existant :", name);
      return res.status(200).json({ success: true, message: "Snapshot déjà existant" });
    }

    if (response.status >= 400) {
      console.error("Erreur création snapshot:", response.status, response.data);
      return res.status(500).json({ error: "Erreur création snapshot", details: response.data });
    }

    // Succès normal
    return res.status(200).json({ success: true, dataset, name });

  } catch (err) {
    console.error("Erreur création snapshot:", err.message);
    return res.status(500).json({ error: "Erreur création snapshot", details: err.message });
  }
});


app.delete('/api/truenas/snapshot/:name', async (req, res) => {
  const snapshot = req.params.name;
  try {
    console.log("Suppression snapshot :", snapshot);
    await axios.delete(`${TRUENAS_HOST}/zfs/snapshot/id/${encodeURIComponent(snapshot)}`, {
      headers: { Authorization: TRUENAS_TOKEN }
    });
    res.json({ success: true });
  } catch (err) {
    console.error("Erreur suppression snapshot:", err.response?.status, err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: "Erreur suppression snapshot" });
  }
});





const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Serveur TrueNAS en écoute sur http://localhost:${port}`);
});

