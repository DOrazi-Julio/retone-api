#!/bin/bash

set -e  # Detiene la ejecución si ocurre algún error

echo "======================================="
echo "🚀 Iniciando proceso de despliegue..."
echo "======================================="

# 1️⃣ Actualizar código desde el repositorio
echo "📦 Actualizando código desde GitHub..."
git fetch origin main
git reset --hard origin/main

# 2️⃣ Reconstruir e iniciar los contenedores
echo "🐳 Construyendo e iniciando contenedores..."
docker compose down
docker compose up -d --build

# 3️⃣ Esperar a que la base de datos esté lista
echo "⏳ Esperando a que la base de datos esté lista..."
sleep 5

# 4️⃣ Ejecutar migraciones con un contenedor temporal
echo "🧩 Ejecutando migraciones..."
docker compose run --rm api npm run migration:run

# 5️⃣ Limpiar contenedores temporales e imágenes huérfanas
echo "🧹 Limpiando recursos no utilizados..."
docker system prune -f

echo "======================================="
echo "✅ Despliegue completado con éxito!"
echo "======================================="
