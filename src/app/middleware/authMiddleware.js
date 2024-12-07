const jwt = require('jsonwebtoken');
const express = require('express');
const UserDAO = require('../dao/UserDAO');

/**
 * Ez a middleware függvény a JWT token ellenőrzésére és a felhasználói jogosultságok ellenőrzésére szolgál.
 * @param reqRole - a szükséges jogosultság; (lehet: 'moderator', 'groupOwner', 'groupMember', 'privateMessage')
 * @returns {(function(*, *, *): (*|undefined))|*} - a következő middleware vagy végpont
 */

const authMiddleware = (reqRole = null) => {
    /**
     * @param req - a kérés: tartalmazza a felhasználói azonosítót (id) a token alapján
     * @param res - a válasz: hibaüzenet küldése, ha a token nem érvényes
     * @param next - a következő middleware vagy végpont
     */
    return async (req, res, next) => {
        // A sütiben tárolt JWT tokent kell lekérjem ugyanis nem mindenhol megoldható hogy tokenes authorization fejléccel érje el az adott végpontot
        const token = req.cookies.jwt;
        if (!token) {
            return res.redirect('/login');
        }

        try {
            req.user = jwt.verify(token, process.env.JWT_SECRET);

            if (!req.user) {
                return res.status(401).json({message: "Nincs hitelesítve"});
            }

            const isModerator = await UserDAO.isModerator(req.user.id);
            req.user.moderator = isModerator;

            // Jogosultság ellenőrzés
            if (reqRole === 'moderator') {
                // console.log("MODERATOR:", isModerator);
                if (isModerator) {
                    return next();
                } else {
                    return res.status(403).json({message: "Nincs jogosultságod a kért művelethez!"});
                }
            }
            next();
        } catch (err) {
            console.error("HIBA (JWT): ", err);
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({message: "token lejárt!"});
            }
            return res.status(403).json({message: "Érvénytelen token!"});
        }
    };
};

module.exports = authMiddleware;
