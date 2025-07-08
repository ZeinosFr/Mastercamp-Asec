const API_BASE = ''; // IP de la VM DMZ

function fullUrl(path) {
  return API_BASE + path;
}


function createWidget(type) {
  const id = Date.now() + Math.floor(Math.random() * 1000);
  let html = "";
   if (type === "interfaces") {
    html = `<div class="card"><h2>🌐 Interfaces ntopng</h2><ul id="interface-list-${id}"><li>Loading...</li></ul></div>`;
  } else if (type === "l4") {
    html = `<div class="card"><h2>📊 Protocoles L4</h2>
    <canvas id="l4Chart-${id}"></canvas>
    <p id="l4ChartInfo-${id}">Chargement...</p></div>`;
  } else if (type === "truenas") {
    html = `<div class="card"><h2>🗄️ TrueNAS</h2><canvas id="diskChart-${id}"></canvas><div id="diskInfo-${id}">Loading...</div></div>`;
  } else if (type === "access") {
    html = `<div class="card"><h2>🔗 Accès aux interfaces</h2>
      <div class="access-grid">
        <div class="access-box"><span class="title">OPNsense</span>
          <a href="http://192.168.10.1" class="button" target="_blank">Accéder</a>
          <div class="status" id="opnsense-status-${id}">⏳ Vérification...</div></div>
        <div class="access-box"><span class="title">ntopng</span>
          <a href="http://192.168.10.1:3000" class="button" target="_blank">Accéder</a>
          <div class="status" id="ntopng-status-${id}">⏳ Vérification...</div></div>
        <div class="access-box"><span class="title">TrueNAS</span>
          <a href="http://192.168.30.101" class="button" target="_blank">Accéder</a>
          <div class="status" id="truenas-status-${id}">⏳ Vérification...</div></div>
        <div class="access-box"><span class="title">OpenVPN</span>
          <a href="http://192.168.10.1:943" class="button" target="_blank">Accéder</a>
          <div class="status" id="openvpn-status-${id}">⏳ Vérification...</div></div>
      </div></div>`;
  } else if (type === "trafic_iface") {
    html = `<div class="card">
      <h2>📈 Trafic par interface (paquets)</h2>
      <canvas id="ifaceChart-${id}"></canvas>
      <p id="ifaceInfo-${id}">Chargement...</p>
    </div>`;
  } else if (type === "global_traffic") {
  html = `<div class="card">
    <h2>📡 Trafic temps réel</h2>
    <canvas id="smoothieChart-${id}" width="600" height="200"></canvas>
    <div class="smoothie-legend" id="smoothie-legend-${id}"></div>
    <p id="smoothieInfo-${id}">Chargement...</p>
  </div>`;
}

 else if (type === "flux_actifs") {
  html = `<div class="card">
    <h2>🔁 Flux réseau actifs</h2>
    <div style="margin-bottom: 0.5rem;">
      <input type="text" id="fluxFilterInput-${id}" placeholder="🔎 Filtrer par IP, protocole, port..." style="width: 100%; padding: 6px; font-size: 0.9rem; border-radius: 6px; border: 1px solid #ccc;">
    </div>
    <div id="fluxStats-${id}" style="font-size: 0.85rem; margin-bottom: 0.4rem;">📊 Statistiques en cours...</div>
    <div class="flow-list" id="flow-list-${id}">
      <div>Chargement...</div>
    </div>
  </div>`;
}

else if (type === "snapshots") {
  html = `<div class="card">
    <h2>🧷 Snapshots TrueNAS</h2>
    <div class="snapshot-actions">
      <input id="snap-dataset-${id}" placeholder="ex: tank/data" />
      <input id="snap-name-${id}" placeholder="Nom snapshot" />
      <button id="snap-create-${id}">Créer</button>
    </div>
    <div id="snap-list-${id}">Chargement...</div>
  </div>`;
}


  const widgetEl = grid.addWidget({x:0, y:0, w:4, h:2, content: html});
  makeCloseButton(widgetEl);
  setTimeout(() => enhanceWidgetContent(widgetEl), 100);
}
function getColor(name) {
  const colors = ['#3498db', '#e67e22', '#2ecc71', '#9b59b6', '#1abc9c', '#e74c3c', '#f1c40f'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function enhanceWidgetContent(el) {


const trafficCanvas = el.querySelector("canvas[id^='smoothieChart']");
const trafficInfo = el.querySelector("p[id^='smoothieInfo']");
if (trafficCanvas && trafficInfo) {
  updateTraffic(trafficCanvas, trafficInfo);
}


const snapList = el.querySelector(`[id^='snap-list-']`);
const snapBtn = el.querySelector(`[id^='snap-create-']`);
const snapDataset = el.querySelector(`[id^='snap-dataset-']`);
const snapName = el.querySelector(`[id^='snap-name-']`);

if (snapList && snapBtn && snapDataset && snapName) {
  let currentFilter = "";
  let sortDescending = true;
  let allSnapshots = [];

  // Supprimer toutes les barres de recherche et boutons déjà présents dans ce widget
  const existingControls = el.querySelectorAll(".snapshot-controls");
  existingControls.forEach(c => c.remove());

  // Création barre filtre + tri
  const filterInput = document.createElement("input");
  filterInput.id = "snapshot-filter";
  filterInput.placeholder = "🔎 Filtrer par nom...";
  filterInput.value = currentFilter;
  filterInput.style = "width: 60%; padding: 5px; margin-right: 10px;";

  const sortBtn = document.createElement("button");
  sortBtn.id = "sort-toggle";
  sortBtn.innerHTML = `Trier <span class="arrow">${sortDescending ? "⬇️" : "⬆️"}</span>`;
  sortBtn.className = "sort-button";

  const controls = document.createElement("div");
  controls.className = "snapshot-controls";
  controls.style.marginBottom = "0.5rem";
  controls.appendChild(filterInput);
  controls.appendChild(sortBtn);

  snapList.before(controls); // insère avant la liste

  // Event listeners
  filterInput.addEventListener("input", e => {
    currentFilter = e.target.value;
    renderSnapshots();
  });

  sortBtn.addEventListener("click", () => {
    sortDescending = !sortDescending;
    sortBtn.innerHTML = `Trier <span class="arrow">${sortDescending ? "⬇️" : "⬆️"}</span>`;
    renderSnapshots();
  });

  // Rendu snapshots
  const renderSnapshots = () => {
    const filtered = allSnapshots.filter(s =>
      s.name.toLowerCase().includes(currentFilter.toLowerCase())
    );

    filtered.sort((a, b) => {
      const t1 = parseInt(a?.properties?.creation?.rawvalue || a?.creation || 0);
      const t2 = parseInt(b?.properties?.creation?.rawvalue || b?.creation || 0);
      return sortDescending ? t2 - t1 : t1 - t2;
    });

    if (filtered.length === 0) {
      snapList.innerHTML = "<div>Aucun snapshot trouvé.</div>";
      return;
    }

    snapList.innerHTML = `
      <table class="flow-table">
        <thead><tr><th>Nom</th><th>Créé</th><th>Actions</th></tr></thead>
        <tbody>
          ${filtered.slice(0, 50).map(snap => {
            const ts = parseInt(snap?.properties?.creation?.rawvalue || snap?.creation || 0);
            const dateStr = ts ? new Date(ts * 1000).toLocaleString() : "Date inconnue";
            return `
              <tr>
                <td>${snap.name}</td>
                <td>${dateStr}</td>
                <td><button class="delete-snap" data-name="${snap.name}">❌</button></td>
              </tr>`;
          }).join("")}
        </tbody>
      </table>
    `;

    snapList.querySelectorAll(".delete-snap").forEach(btn => {
      const name = btn.dataset.name;
      btn.onclick = () => {
        if (confirm(`Supprimer ${name} ?`)) {
          fetch(fullUrl(`/api/truenas/snapshot/${encodeURIComponent(name)}`), {
            method: "DELETE"
          })
          .then(res => {
            if (!res.ok) throw new Error("Suppression échouée");
            updateSnapshots();
          })
          .catch(err => {
            console.error("Erreur suppression:", err.message);
            alert("❌ Échec de la suppression.");
          });
        }
      };
    });
  };

  const updateSnapshots = () => {
    fetch(fullUrl("/api/truenas/snapshots"))
      .then(res => res.json())
      .then(data => {
        allSnapshots = data;
        renderSnapshots();
      })
      .catch(() => {
        snapList.innerHTML = "<div>Erreur chargement snapshots</div>";
      });
  };

  // Nettoyage puis réattachement du bouton "Créer"
  snapBtn.replaceWith(snapBtn.cloneNode(true));
  const newSnapBtn = el.querySelector(`[id^='snap-create-']`);
  newSnapBtn.addEventListener("click", () => {
    const dataset = snapDataset.value.trim();
    const name = snapName.value.trim();
    if (!dataset || !name) {
      alert("Veuillez renseigner le dataset et le nom.");
      return;
    }

    fetch(fullUrl("/api/truenas/snapshot"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataset, name })
    })
      .then(res => {
        if (!res.ok) throw new Error("Erreur snapshot");
        snapDataset.value = "";
        snapName.value = "";
        updateSnapshots();
      })
      .catch(err => {
        console.error("Erreur création snapshot:", err.message);
        alert("Erreur lors de la création.");
      });
  });

  updateSnapshots();
  setInterval(updateSnapshots, 20000);
}




const ifaceList = el.querySelector("[id^='interface-list']");
if (ifaceList) {
  const updateInterfaces = () => {
    fetch(fullUrl("/api/ntopng/interfaces"))
      .then(res => res.json())
      .then(data => {
        // 🧩 Tri alphabétique fixe par nom d'interface
        data.sort((a, b) => a.name.localeCompare(b.name));

        ifaceList.innerHTML = `
          <div class="iface-grid">
            ${data.map(i => {
              const a = aliasMap[i.name] || {};
              const ip = a.ip || "IP inconnue";
              const alias = a.alias || i.name;
              const traffic = (i.total_traffic / 1e6).toFixed(2) + " Mo";

              return `
                <div class="iface-card">
                  <div class="iface-title">${alias} <span class="iface-name">(${i.name})</span></div>
                  <div class="iface-ip">IP : ${ip}</div>
                  <div class="iface-traffic">Trafic total : ${traffic}</div>
                  <div class="iface-stats">
                    <span>📦 Packets : ${i.total_packets}</span>
                    <span>❌ Dropped : ${i.dropped_packets}</span>
                    <span>🌐 Hosts : ${i.remote_hosts}</span>
                    <span>🧭 Devices : ${i.devices}</span>
                    <span>🔁 Flows : ${i.flows}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>`;
      });
  };

  updateInterfaces(); // initial
  setInterval(updateInterfaces, 2000); // toutes les 2 secondes
}



const diskInfo = el.querySelector("[id^='diskInfo']");
if (diskInfo) {
  const id = diskInfo.id.split("diskInfo-")[1];
  fetch(fullUrl("/api/truenas/disks"))
    .then(res => res.json())
    .then(data => {
      const disk = data[0];
      const usage = ((disk.utilisé / disk.taille) * 100).toFixed(1);
      const ctx = document.getElementById("diskChart-" + id).getContext("2d");
      const colors = usage > 90 ? ['#e74c3c', '#95a5a6'] :
                     usage > 70 ? ['#f39c12', '#bdc3c7'] :
                                  ['#2ecc71', '#ecf0f1'];

      diskInfo.innerHTML = `
        <div><strong>Nom :</strong> ${disk.nom}</div>
        <div><strong>Utilisé :</strong> ${(disk.utilisé / 1e9).toFixed(2)} Go</div>
        <div><strong>Libre :</strong> ${(disk.libre / 1e9).toFixed(2)} Go</div>
        <div><strong>Total :</strong> ${(disk.taille / 1e9).toFixed(2)} Go</div>
        <div><strong>Utilisation :</strong> ${usage} %</div>
      `;

      if (document.getElementById("diskChart-" + id)._chart instanceof Chart) {
        document.getElementById("diskChart-" + id)._chart.destroy();
      }

      document.getElementById("diskChart-" + id)._chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Utilisé', 'Libre'],
          datasets: [{
            data: [disk.utilisé / 1e9, disk.libre / 1e9],
            backgroundColor: colors
          }]
        },
        options: {
          plugins: {
            legend: { position: 'bottom' },
            tooltip: { callbacks: { label: ctx => ctx.label + ": " + ctx.raw.toFixed(2) + " Go" } }
          },
          animation: {
            duration: 800,
            easing: 'easeOutBack'
          }
        }
      });
    });
}

const flowList = el.querySelector("[id^='flow-list-']");
const filterInput = el.querySelector("input[id^='fluxFilterInput']");
const statsDisplay = el.querySelector("[id^='fluxStats-']");
let allFlows = [];

if (flowList && filterInput && statsDisplay) {
  const renderTable = (filter = "") => {
    const filtered = allFlows.filter(f => {
      const query = filter.toLowerCase();
      return (
        f.src_ip?.toLowerCase().includes(query) ||
        f.dst_ip?.toLowerCase().includes(query) ||
        (f.protocol?.l4 || "").toLowerCase().includes(query) ||
        (f.protocol?.l7 || "").toLowerCase().includes(query) ||
        (f.src_port + "").includes(query) ||
        (f.dst_port + "").includes(query)
      );
    });

    const totalBytes = filtered.reduce((sum, f) => sum + (f.total_bytes || 0), 0);
    const avgDuration = filtered.length ? (filtered.reduce((sum, f) => sum + (f.flow_duration || 0), 0) / filtered.length) : 0;

    statsDisplay.innerHTML = `📈 ${filtered.length} flux — 💾 ${(totalBytes / 1024).toFixed(1)} Ko — ⏱️ durée moyenne ${(avgDuration).toFixed(1)} s`;

    if (filtered.length === 0) {
      flowList.innerHTML = "<div>Aucun flux actif correspondant</div>";
      return;
    }

    flowList.innerHTML = `
      <table class="flow-table">
        <thead><tr>
          <th>Client</th><th>→</th><th>Serveur</th>
          <th>Protocole</th><th>Octets</th><th>Durée</th>
        </tr></thead>
        <tbody>
          ${filtered.slice(0, 50).map(flow => {
            const proto = [flow.protocol?.l4, flow.protocol?.l7].filter(Boolean).join(" / ") || "N/A";
            const src = `${flow.src_ip}:${flow.src_port}`;
            const dst = `${flow.dst_ip}:${flow.dst_port}`;
            const bytes = (flow.total_bytes / 1024).toFixed(1) + " Ko";
            const duration = flow.flow_duration.toFixed(1) + " s";

            return `<tr>
              <td>${src}</td>
              <td>→</td>
              <td>${dst}</td>
              <td>${proto}</td>
              <td>${bytes}</td>
              <td>${duration}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`;
  };

  const updateFlows = () => {
    fetch(fullUrl("/api/ntopng/flows/active/all"))
      .then(res => res.json())
      .then(data => {
        allFlows = data;
        renderTable(filterInput.value);
      })
      .catch(err => {
        console.warn("Erreur flux actifs :", err.message);
        flowList.innerHTML = "<div>Erreur de chargement</div>";
      });
  };

  filterInput.addEventListener("input", () => renderTable(filterInput.value));
  updateFlows();
  setInterval(updateFlows, 1000);
}

 
const l4Canvas = el.querySelector("canvas[id^='l4Chart']");
const l4Info = el.querySelector("p[id^='l4ChartInfo']");
if (l4Canvas && l4Info) {
  updateL4Chart(l4Canvas, l4Info);
}





// === Interface Packets Widget (multi-line, one per interface) ===
const ifaceCanvas = el.querySelector("canvas[id^='ifaceChart']");
const ifaceInfo = el.querySelector("p[id^='ifaceInfo']");
if (ifaceCanvas && ifaceInfo) {
  updateIfaceChart(ifaceCanvas, ifaceInfo);
}







["opnsense", "ntopng", "truenas", "openvpn"].forEach(service => {
  const status = el.querySelector(`[id^='${service}-status-']`);
  if (status) {
    const port = service === "ntopng" ? ":3000" : service === "openvpn" ? ":943" : "";
    const host = service === "truenas" ? "192.168.30.101" : "192.168.10.1";
    const url = `http://${host}${port}`;
    const start = performance.now();

    fetch(url, { mode: 'no-cors' })
      .then(() => {
        const ms = Math.floor(performance.now() - start);
        status.textContent = `✅ En ligne (${ms} ms)`;
        status.classList.remove("red");
        status.classList.add("green");
      })
      .catch(() => {
        status.textContent = "❌ Hors ligne";
        status.classList.remove("green");
        status.classList.add("red");
      });
  }
});
}
let trafficChart;

function updateTraffic(trafficCanvas, trafficInfo) {
  const interfaces = ["em0", "em1", "em2", "em3"];
  const colors = {
    em0: '#3498db',
    em1: '#e67e22',
    em2: '#2ecc71',
    em3: '#9b59b6'
  };

  const chart = new SmoothieChart({
    millisPerPixel: 100,
    maxValueScale: 1.2,
    minValue: 0,
    grid: {
      strokeStyle: 'rgba(180,180,180,0.2)',
      fillStyle: getComputedStyle(document.body).getPropertyValue('--bg') || '#ffffff',
      lineWidth: 1,
      millisPerLine: 200,
      verticalSections: 4
    },
    labels: {
      fillStyle: getComputedStyle(document.body).getPropertyValue('--text') || '#2c3e50',
      precision: 2,
      fontSize: 12
    },
    yAxis: {
      strokeStyle: '#bbb',
      fillStyle: getComputedStyle(document.body).getPropertyValue('--text') || '#2c3e50',
      fontSize: 11,
      maxValue: undefined,
      minValue: 0,
      verticalAlign: 'middle'
    }
  });

  chart.streamTo(trafficCanvas, 1000);

  const seriesMap = {};
  const currentValues = {};
  interfaces.forEach(name => {
    const ts = new TimeSeries();
    chart.addTimeSeries(ts, {
      strokeStyle: colors[name],
      fillStyle: colors[name] + '33',
      lineWidth: 2
    });
    seriesMap[name] = ts;
    currentValues[name] = 0;
  });

  const id = trafficCanvas.id.split("smoothieChart-")[1];
  const legendEl = document.getElementById("smoothie-legend-" + id);
  if (legendEl) {
    legendEl.innerHTML = `
      <div class="entry total-entry">
        🧮 Total : <span id="legend-total-${id}">0.00</span> Mo/s
      </div>` + interfaces.map(name => `
      <div class="entry" id="legend-entry-${id}-${name}">
        <div class="color-box" style="background:${colors[name]}"></div>
        ${name} — <span class="mo-value">0.00</span> Mo/s
      </div>
    `).join("");
  }

  let previous = {};
  let smoothPrev = {};

  setInterval(() => {
    const now = Date.now();

    fetch(fullUrl("/api/ntopng/interfaces"))
      .then(res => res.json())
      .then(data => {
        const dataMap = Object.fromEntries(data.map(i => [i.name, i]));

        let total = 0;
        interfaces.forEach(name => {
          const iface = dataMap[name];
          if (!iface) return;

          const prev = previous[name];
          const delta = prev ? (iface.total_traffic - prev.traffic) / ((now - prev.time) / 1000) : 0;
          const raw = isFinite(delta) ? delta / 1e6 : 0;
          const smooth = smoothPrev[name] !== undefined ? (raw + smoothPrev[name]) / 2 : raw;
          const capped = Math.max(0, Math.min(smooth, 1000));

          smoothPrev[name] = capped;
          previous[name] = { traffic: iface.total_traffic, time: now };
          seriesMap[name].append(now, capped);
          currentValues[name] = capped;
          total += capped;

          const entry = document.querySelector(`#legend-entry-${id}-${name} .mo-value`);
          if (entry) entry.textContent = capped.toFixed(2);
        });

        const totalEntry = document.getElementById(`legend-total-${id}`);
        if (totalEntry) totalEntry.textContent = total.toFixed(2);

        trafficInfo.innerHTML = `<span class="update-info">Dernière mise à jour : ${new Date().toLocaleTimeString()}</span>`;
      })
      .catch(err => {
        trafficInfo.innerHTML = `<span class="update-info">❌ ${err.message}</span>`;
      });
  }, 1000);
}







let l4Chart;

function updateL4Chart(l4Canvas, l4Info) {
  const ctx = l4Canvas.getContext("2d");

  const refresh = () => {
    fetch(fullUrl("/api/ntopng/interfaces/basic"))
      .then(res => res.json())
      .then(ifaces => {
        const sorted = ifaces.filter(i => i.ifid !== undefined).sort((a, b) => a.name.localeCompare(b.name));

        return Promise.all(sorted.map(i =>
          fetch(fullUrl(`/api/ntopng/l4/${i.ifid}`))
            .then(r => r.json())
            .then(protocols => ({ name: i.name, protocols }))
            .catch(() => ({ name: i.name, protocols: [] }))
        ));
      })
      .then(allData => {
        const label = new Date().toLocaleTimeString();
        const allProtocols = Array.from(new Set(allData.flatMap(d => d.protocols.map(p => p.name)))).sort();

        const labels = allData.map(d => d.name);
        const datasets = allProtocols.map(p => ({
          label: p,
          data: allData.map(d => d.protocols.find(x => x.name === p)?.count || 0)
        }));

        if (!l4Chart) {
          l4Chart = new Chart(ctx, {
            type: "bar",
            data: { labels, datasets },
            options: {
              responsive: true,
              animation: false,
              plugins: { legend: { position: 'bottom' } },
              scales: { y: { beginAtZero: true, title: { display: true, text: "Nombre de flux" } } }
            }
          });
        } else {
          l4Chart.data.labels = labels;

          allProtocols.forEach((p, i) => {
            const existing = l4Chart.data.datasets.find(d => d.label === p);
            if (existing) {
              existing.data = datasets[i].data;
            } else {
              l4Chart.data.datasets.push(datasets[i]);
            }
          });

          l4Chart.data.datasets = l4Chart.data.datasets.filter(ds => allProtocols.includes(ds.label));
          l4Chart.update();
        }

        l4Info.innerHTML = `<span class="update-info">Dernière mise à jour : ${label}</span>`;
      });
  };

  refresh();
  setInterval(refresh, 2000);
}


let ifaceChart;

function updateIfaceChart(canvas, info) {
  const ctx = canvas.getContext("2d");

  const refresh = () => {
    fetch("" + API_BASE + "/api/ntopng/interfaces")
      .then(res => res.json())
      .then(data => {
        const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
        const label = new Date().toLocaleTimeString();

        const labels = ["Total packets"];
        const datasets = sorted.map(i => ({
          label: i.name,
          data: [i.total_packets],
          backgroundColor: getColor(i.name) + "33",
          borderColor: getColor(i.name),
          borderWidth: 2
        }));

        if (!ifaceChart) {
          ifaceChart = new Chart(ctx, {
            type: "bar",
            data: { labels, datasets },
            options: {
              responsive: true,
              animation: false,
              plugins: { legend: { position: "bottom" } },
              scales: { y: { beginAtZero: true, title: { display: true, text: "Paquets totaux" } } }
            }
          });
        } else {
          sorted.forEach((i, idx) => {
            const existing = ifaceChart.data.datasets.find(d => d.label === i.name);
            if (existing) {
              existing.data[0] = i.total_packets;
            } else {
              ifaceChart.data.datasets.push(datasets[idx]);
            }
          });

          ifaceChart.data.datasets = ifaceChart.data.datasets.filter(d => sorted.some(i => i.name === d.label));
          ifaceChart.update();
        }

        info.innerHTML = `<span class="update-info">Dernière mise à jour : ${label}</span>`;
      });
  };

  refresh();
  setInterval(refresh, 2000);
}

function drawIfaceChart(canvas, info, iface) {
  if (!iface) return;
  const ctx = canvas.getContext("2d");
  if (canvas._chart instanceof Chart) canvas._chart.destroy();

  canvas._chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Total packets', 'Dropped', 'Remote Hosts', 'Devices', 'Flows'],
      datasets: [{
        label: iface.name,
        data: [
          iface.total_packets,
          iface.dropped_packets,
          iface.remote_hosts,
          iface.devices,
          iface.flows
        ],
        backgroundColor: ['#3498db', '#e74c3c', '#8e44ad', '#f39c12', '#2ecc71']
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });

  info.innerHTML = `<strong>Trafic total :</strong> ${(iface.total_traffic / 1e6).toFixed(2)} Mo`;
}

function loadL4Chart(canvas, infoText, ifid) {
  if (!ifid || ifid === "undefined") {
    console.warn("ifid invalide pour L4:", ifid);
    infoText.textContent = "Aucune interface sélectionnée";
    return;
  }

  infoText.textContent = "Chargement...";
    fetch(fullUrl(`/api/ntopng/l4/${encodeURIComponent(ifid)}`))
    .then(res => {
      if (!res.ok) throw new Error("L4 API status " + res.status);
      return res.json();
    })
    .then(protocols => {
      if (!Array.isArray(protocols)) {
        infoText.textContent = "Données L4 invalides";
        return;
      }

      const labels = protocols.map(p => p.name);
      const counts = protocols.map(p => p.count);
      const ctx = canvas.getContext("2d");
      if (canvas._chart instanceof Chart) canvas._chart.destroy();
      canvas._chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{ label: "Flux", data: counts, backgroundColor: "#3498db" }]
        },
        options: {
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }
      });
      infoText.textContent = "";
    })
    .catch(err => {
      console.error("Erreur L4:", err.message);
      infoText.textContent = "Erreur lors du chargement.";
    });
}

// Export global
window.createWidget = createWidget;
window.enhanceWidgetContent = enhanceWidgetContent;
window.loadL4Chart = loadL4Chart;
window.drawIfaceChart = drawIfaceChart;
