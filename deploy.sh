#!/usr/bin/env bash
set -e

# Ir al directorio del proyecto
cd "$(dirname "$0")"

echo "Actualizando código desde el repositorio..."
git pull origin main

echo "Instalando dependencias npm si es necesario..."
npm install

echo "Reconstruyendo y levantando servicios con Docker Compose..."
docker compose down
docker compose up -d --build

echo "Ejecutando migraciones..."
docker compose exec api npm run migration:run

echo "Despliegue completado correctamente."
