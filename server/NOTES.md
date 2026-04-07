# AR.IA — Carnet de bord serveur
Mis à jour le : 07/04/2026

## VPS OVH
- IP : 51.77.151.2
- Utilisateur SSH : ubuntu
- Datacenter : Strasbourg
- OS : Ubuntu 25.04
- Offre : VPS-1 (4 vCores, 8Go RAM, 75Go SSD) — 5,52€/mois HT

## Connexion SSH
```
ssh ubuntu@51.77.151.2
```

## Domaines
- ar-ia.fr → vitrine (Vercel, repo GitHub ai-reporting-zen, branche main)
- app.ar-ia.fr → application (VPS OVH, IP 51.77.151.2)

## Application AR.IA
- Dossier : /home/ubuntu/aria/
- Fichier principal : /home/ubuntu/aria/main.py
- Templates HTML : /home/ubuntu/aria/templates/
- Environnement Python : /home/ubuntu/aria/venv/

## Login app.ar-ia.fr
- Identifiant : admin
- Mot de passe : (celui que tu as défini)

## Commandes utiles
# Voir l'état du service
sudo systemctl status aria

# Redémarrer le service
sudo systemctl restart aria

# Voir les logs en cas d'erreur
sudo journalctl -u aria -n 50

# Modifier le code
nano /home/ubuntu/aria/main.py

# Activer l'environnement Python
source /home/ubuntu/aria/venv/bin/activate

## Stack technique
- Backend : FastAPI + Uvicorn
- Reverse proxy : Nginx
- HTTPS : Let's Encrypt (renouvellement automatique)
- LLM ar.ia : OpenAI (migration Mistral prévue)
- LLM dev : Claude (Anthropic)

## Prochaines étapes
1. Déployer Streamlit sur le VPS (démos rapides)
2. Construire la version FastAPI complète
3. Migration LLM vers Mistral
4. Intégration Deytime (RDV à planifier)

## GitHub
- Repo vitrine : https://github.com/audreybousquet-a11y/ai-reporting-zen
- Fichiers serveur : dossier /server/ dans le repo
