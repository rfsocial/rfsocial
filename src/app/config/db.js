const fs = require('fs');

/*
Lokális adatbázis csatlakozáshoz az .env fájlban a következőket kell kitölteni:
-------------------------------------------------------------------------------
PG_USER=<név> - alapértelmezetten: postgres
PG_HOST=localhost
PG_DATABASE=<adatbázis neve>
PG_PASSWORD=<jelszó>
PG_PORT=5432
 */

const { Client } = require('pg');
const client = new Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
    ssl: {
        rejectUnauthorized: false,
        ca: process.env.PG_SSL_CA_PATH
    }
});

module.exports = client;
