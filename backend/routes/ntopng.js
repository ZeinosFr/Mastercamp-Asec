
const express = require('express');
const axios = require('axios');
const router = express.Router();

const NTOPNG_BASE = process.env.NTOPNG_BASE;
const NTOPNG_AUTH = process.env.NTOPNG_AUTH;

// Mapping des ID protocoles L4
const l4Protocols = {
  1: "ICMP", 6: "TCP", 17: "UDP", 47: "GRE", 50: "ESP", 51: "AH", 58: "ICMPv6", 89: "OSPF"
};

// Route pour widget L4 — nécessite ifid
router.get('/l4/:ifid', async (req, res) => {
  const ifid = req.params.ifid;
  if (!ifid || ifid === "undefined") {
    return res.status(400).json({ error: "ifid manquant ou invalide" });
  }

  try {
    const url = `${NTOPNG_BASE}/lua/rest/v2/get/flow/l4/counters.lua?ifid=${encodeURIComponent(ifid)}`;
    const response = await axios.get(url, {
      headers: { Authorization: NTOPNG_AUTH }
    });

    const data = response.data.rsp || [];
    const result = data.map(p => ({
      name: l4Protocols[p.id] || "ID " + p.id,
      count: p.count
    }));

    res.json(result);
  } catch (err) {
    console.error("Erreur /l4/:ifid :", err.message);
    res.status(500).json({ error: "Impossible de récupérer les protocoles L4" });
  }
});

// Route principale pour les stats d'interface (trafic, paquets, etc.)
router.get('/interfaces', async (req, res) => {
  try {
    const url = `${NTOPNG_BASE}/lua/rest/v2/get/system/health/interfaces.lua`;
    const response = await axios.get(url, {
      headers: { Authorization: NTOPNG_AUTH }
    });

    const raw = response.data.rsp || {};
    const stats = raw.interfaces_stats || {};

    const result = Object.entries(stats).map(([name, data]) => ({
      name,
      total_packets: data.total_packets,
      dropped_packets: data.dropped_packets,
      total_traffic: data.total_traffic,
      flows: data.flows,
      devices: data.devices,
      remote_hosts: data.remote_hosts,
      rx_bps: data.rx_bps,
      tx_bps: data.tx_bps
    }));

    res.json(result);
  } catch (err) {
    console.error("Erreur /interfaces :", err.message);
    res.status(500).json({ error: "Impossible de récupérer les interfaces enrichies" });
  }
});

// Route simplifiée pour récupérer les ifid pour le widget L4
router.get('/interfaces/basic', async (req, res) => {
  try {
    const url = `${NTOPNG_BASE}/lua/rest/v2/get/ntopng/interfaces.lua`;
    const response = await axios.get(url, {
      headers: { Authorization: NTOPNG_AUTH }
    });

    const interfaces = response.data.rsp || [];

    const result = interfaces.map(iface => ({
      name: iface.name || iface.ifname,
      ifid: iface.ifid
    }));

    res.json(result);
  } catch (err) {
    console.error("Erreur /interfaces/basic :", err.message);
    res.status(500).json({ error: "Impossible de récupérer les interfaces de base" });
  }
});

router.get('/flows/active', async (req, res) => {
  const ifid = req.query.ifid;
  if (!ifid) {
    return res.status(400).json({ error: "Paramètre ifid requis (ex: ?ifid=1)" });
  }

  try {
    const url = `${NTOPNG_BASE}/lua/rest/v2/get/flow/active.lua?ifid=${encodeURIComponent(ifid)}`;
    const response = await axios.get(url, {
      headers: { Authorization: NTOPNG_AUTH }
    });

    const flows = response.data.rsp?.data || [];
    const result = flows.map(flow => ({
  src_ip: flow.client?.ip || null,
  src_port: flow.client?.port || null,
  dst_ip: flow.server?.ip || null,
  dst_port: flow.server?.port || null,
  protocol: flow.protocol,
  total_bytes: flow.bytes || flow.total_bytes || 0,
  flow_duration: flow.duration || flow.flow_duration || 0
}));


    res.json(result);
  } catch (err) {
    console.error("Erreur /flows/active :", err.message);
    res.status(500).json({ error: "Impossible de récupérer les flux actifs" });
  }
});

router.get('/flows/active/all', async (req, res) => {
  try {
    // Étape 1 : récupérer les ifid disponibles
    const ifaceRes = await axios.get(`${NTOPNG_BASE}/lua/rest/v2/get/ntopng/interfaces.lua`, {
      headers: { Authorization: NTOPNG_AUTH }
    });

    const interfaces = ifaceRes.data.rsp || [];
    const ifids = interfaces.map(i => i.ifid);

    // Étape 2 : requêtes en parallèle pour chaque interface
    const allFlows = await Promise.all(
      ifids.map(async ifid => {
        try {
          const flowRes = await axios.get(`${NTOPNG_BASE}/lua/rest/v2/get/flow/active.lua?ifid=${ifid}`, {
            headers: { Authorization: NTOPNG_AUTH }
          });

          const flows = flowRes.data.rsp?.data || [];
          return flows.map(flow => ({
            ifid,
            src_ip: flow.src_ip || flow.client?.ip,
            src_port: flow.src_port || flow.client?.port,
            dst_ip: flow.dst_ip || flow.server?.ip,
            dst_port: flow.dst_port || flow.server?.port,
            protocol: flow.protocol,
            total_bytes: flow.bytes || flow.total_bytes,
            flow_duration: flow.duration || flow.flow_duration
          }));
        } catch (e) {
          console.warn(`Erreur récupération des flux pour ifid ${ifid} :`, e.message);
          return [];
        }
      })
    );

    // Étape 3 : fusionner les flux de toutes les interfaces
    const merged = allFlows.flat();
    res.json(merged);
  } catch (err) {
    console.error("Erreur /flows/active/all :", err.message);
    res.status(500).json({ error: "Impossible de récupérer les flux multi-interfaces" });
  }
});

module.exports = router;

