#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

echo "Actualizando código desde el repositorio..."
git pull origin main

echo "Instalando dependencias npm si es necesario..."
npm install

echo "Reconstruyendo y levantando servicios con Docker Compose..."
docker compose down
docker compose up -d --build

echo "Esperando a que la base de datos esté lista..."
sleep 5

echo "Ejecutando migraciones..."
docker compose run --rm api npm run migration:run

echo "Despliegue completado correctamente."
