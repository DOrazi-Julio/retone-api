#!/usr/bin/env bash
set -e

/opt/wait-for-it.sh ${DATABASE_HOST}:${DATABASE_PORT}
npm run migration:run
npm run seed:run:relational
npm run start:prod
