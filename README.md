# 🔐 Dashboard Réseau – ASec

Portail web de supervision réseau développé pour une infrastructure virtualisée (VMware) avec des outils open source : **ntopng**, **TrueNAS**, **OPNsense**.

---

## 🧰 Prérequis

- Node.js (v18 ou supérieur)
- npm
- Serveur Ubuntu (VM hébergeant le frontend)
- Accès réseau aux services suivants :
  - ntopng (API REST)
  - TrueNAS (API REST)
  - OPNsense (ping/status HTTP)

---

## 🚀 Installation du backend


cd backend
npm install


---

## 💻 Déploiement du frontend

Le site est entièrement statique, aucun framework n’est utilisé. Il peut être servi :

- Soit en local via Python :
  python3 -m http.server 8080

## ⚙️ Configuration du backend

Créer un fichier `.env` dans le dossier `backend` :

env
PORT=4000
TRUENAS_HOST=http://192.168.30.101/api/v2.0
TRUENAS_TOKEN=Token votre_token_ici
NTOPNG_BASE=http://192.168.10.1:3000
NTOPNG_AUTH=Basic YWRtaW46a2Vubnk=
NTOPNG_IFID=0



Puis lancer :

bash
node index.js



## 🔗 Lancement du site

1. Démarrer le backend sur la VM API (port 4000)
2. Démarrer le serveur web (frontend) sur la VM Web
3. Accéder au dashboard :
  
   http://<IP_VM_Web>/
 

---

## 🧪 Fonctionnalités

- 📡 Trafic temps réel (Smoothie.js)
- 🌐 Interfaces réseau (IP, paquets, drops…)
- 📊 Protocoles L4 utilisés
- 🔁 Flux réseau actifs avec filtre dynamique
- 🗄️ Stockage TrueNAS (graphe disque, % utilisé)
- 🧷 Snapshots TrueNAS (création / suppression)
- 🔗 Accès rapide : OPNsense, TrueNAS, ntopng, OpenVPN

---

## 📌 Remarques

- Tous les appels API passent par la VM API (`API_BASE`)
- Le trafic est routé entre les LANs via OPNsense

Réalisé par Kenny LUDOVIC, étudiant à l'Efrei Paris
