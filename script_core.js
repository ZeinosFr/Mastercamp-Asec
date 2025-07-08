let grid;
const layoutKey = "grid-layout-v3";

const aliasMap = {
  "em0": { ip: "192.168.10.1", alias: "LAN admin" },
  "em1": { ip: "192.168.20.1", alias: "LAN Employé" },
  "em2": { ip: "192.168.30.1", alias: "LAN DMZ" },
  "em3": { ip: "192.168.40.1", alias: "Wifi invité" }
};

function initGrid() {
  grid = GridStack.init({
    cellHeight: 120,
    float: true,
    resizable: { handles: 'e, se, s, sw, w' },
    draggable: {
  handle: '.widget-title'
}

  });

  const saved = localStorage.getItem(layoutKey);
  if (saved) {
    try {
      const layout = JSON.parse(saved);
      layout.forEach(w => {
        const el = grid.addWidget(w);
        makeCloseButton(el);
        enhanceWidgetContent(el);
      });
    } catch (e) {
      console.error("Erreur chargement layout:", e);
    }
  }

  grid.on("change", () => {
    const layout = grid.save(true);
    localStorage.setItem(layoutKey, JSON.stringify(layout));
  });
}

function makeCloseButton(widgetEl) {
  const btn = document.createElement("div");
  btn.className = "widget-close";
  btn.innerHTML = "✖";
  btn.onclick = () => {
    grid.removeWidget(widgetEl);
    localStorage.setItem(layoutKey, JSON.stringify(grid.save(true)));
  };
  widgetEl.appendChild(btn);
}

function toggleDarkMode() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
}

// Charger le thème sauvegardé au démarrage
window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
});

function setupWidgetMenu() {

  // Menu des widgets
  const menu = document.createElement("div");
  menu.className = "widget-selector";
  menu.innerHTML = `
    <h3>Ajouter un widget</h3>
    <button onclick="createWidget('interfaces')">🌐 Interfaces</button>
    <button onclick="createWidget('l4')">📊 Protocoles L4</button>
    <button onclick="createWidget('truenas')">🗄️ TrueNAS</button>
    <button onclick="createWidget('access')">🔗 Accès aux interfaces</button>
    <button onclick="createWidget('trafic_iface')">📈 Trafic Interface</button>
    <button onclick="createWidget('global_traffic')">📡 Trafic réseau global</button>
    <button onclick="createWidget('flux_actifs')">🔁 Flux réseau actifs</button>
    <button onclick="createWidget('snapshots')">🧷 Snapshots TrueNAS</button>


    <button onclick="grid.removeAll()">🧹 Tout supprimer</button>
  `;
  document.body.appendChild(menu);
}

function toggleWidgetMenu() {
  const menu = document.querySelector(".widget-selector");
  if (menu) {
    menu.classList.toggle("visible");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initGrid();
  setupWidgetMenu();
});


const translations = {
  en: {
    'dashboard_title': '🔐 Network Dashboard – ASec',
    'interface_graph': '📈 Interface – Graph',
    'add_widget': '➕ Widgets',
    'dark_mode': '🌙 Dark Mode',
    'language': '🌐 Language',
    'widget_interfaces': '🌐 Interfaces',
    'widget_l4': '📊 L4 Protocols',
    'widget_truenas': '🗄️ TrueNAS',
    'widget_access': '🔗 Interface Access',
    'widget_iface_traffic': '📈 Interface Traffic',
    'widget_global_traffic': '📡 Global Network Traffic',
    'widget_clear': '🧹 Clear All',
    'widget_menu_title': 'Add a widget',
    'mode_sombre': '🌙 Dark Mode',
  },
  fr: {
    'dashboard_title': '🔐 Dashboard Réseau – ASec',
    'interface_graph': '📈 Interface – Graphique',
    'add_widget': '➕ Widgets',
    'dark_mode': '🌙 Mode Sombre',
    'language': '🌐 Langue',
    'widget_interfaces': '🌐 Interfaces',
    'widget_l4': '📊 Protocoles L4',
    'widget_truenas': '🗄️ TrueNAS',
    'widget_access': '🔗 Accès aux interfaces',
    'widget_iface_traffic': '📈 Trafic Interface',
    'widget_global_traffic': '📡 Trafic réseau global',
    'widget_clear': '🧹 Tout supprimer',
    'widget_menu_title': 'Ajouter un widget',
    'mode_sombre': '🌙 Mode Sombre',
  }
};


let currentLang = localStorage.getItem("lang") || "fr";

function toggleLanguage() {
  currentLang = currentLang === "fr" ? "en" : "fr";
  localStorage.setItem("lang", currentLang);
  translateUI();
}


function translateUI() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (translations[currentLang][key]) {
      el.innerText = translations[currentLang][key];
    }
  });
  document.querySelectorAll(".grid-stack-item").forEach(widget => {
  if (!widget.dataset.enhanced) {
    enhanceWidgetContent(widget);
    widget.dataset.enhanced = "true";
  }
});

}


// Exécute au chargement
window.addEventListener('DOMContentLoaded', () => {
  translateUI();
});


