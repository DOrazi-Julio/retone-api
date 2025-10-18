#!/usr/bin/env bash
set -e

/opt/wait-for-it.sh retone-dev-db.cluster-cjc2wcmgg4jb.us-east-2.rds.amazonaws.com:5432
npm run migration:run
npm run seed:run:relational
npm run start:prod
