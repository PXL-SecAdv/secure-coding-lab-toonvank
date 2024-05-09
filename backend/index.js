const pg = require("pg");
require("dotenv").config();
const { Pool } = require("pg");

const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const cors = require("cors");

const port = 3000;

const pool = new Pool({
    user: process.env.DATABASE_USER,
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_NAME,
    password: process.env.DATABASE_PASSWORD,
    port: process.env.DATABASE_PORT,
    connectionTimeoutMillis: 5000,
});

console.log("Connecting...:");

app.use(
    cors({
        origin: "http://localhost:8080/",
    })
);
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

const bcrypt = require("bcrypt");

app.get("/authenticate/:username/:password", async (request, response) => {
    const username = request.params.username;
    const password = request.params.password;

    const query = "SELECT * FROM users WHERE user_name=$1";
    const values = [username];

    pool.query(query, values, async (error, results) => {
        if (error) {
            throw error;
        }
        if (results.rows.length === 0) {
            response.status(401).json({ message: "Gebruiker niet gevonden" });
            return;
        }

        const user = results.rows[0];
        const hashedPassword = user.password;

        try {
            if (await bcrypt.compare(password, hashedPassword)) {
                response.status(200).json({ message: "Gebruiker geauthenticeerd" });
            } else {
                response
                    .status(401)
                    .json({ message: "Ongeldige gebruikersnaam of wachtwoord" });
            }
        } catch (error) {
            console.error("Fout bij het vergelijken van wachtwoorden:", error);
            response.status(500).json({ message: "Interne serverfout" });
        }
    });
});

app.listen(port, () => {
    console.log("App running on port ${port}.");
});