const UserDAO = require('../dao/UserDAO');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const NotificationService = require('../services/NotificationService');
const NotificationInteraction = require('../constants/NotificationInteraction');
const { usersReceivingUnreadPushNotifications } = require("./notificationController");
const onlineUsersId = require('../config/online_users');

const register = async(req, res) => {
    const { username, email, password } = req.body;
    try {
        const existingUser = await UserDAO.getUserByName(username);
        if(existingUser) {
            return res.status(400).json({ message: "Ez a felhasználó már létezik! "});
        }
        let hashedPass = await bcrypt.hash(password, 10);
        await UserDAO.create(username, email, hashedPass);
        res.status(201).json({ message: "Sikeres regisztráció!" });
    } catch(error) {
        res.status(500).json({ message: 'Hiba történt a regisztráció során!', error });
    }
};

const login = async(req, res) => {
    const { username, password } = req.body;
    try {
        const user = await UserDAO.getUserByName(username);
        if(!user) {
            return res.status(400).json({ message: "Rossz felhasználónév vagy jelszó!" });
        }
        const passMatch = await bcrypt.compare(password, user.password);
        if(!passMatch) {
            return res.status(400).json({ message: "Rossz felhasználónév vagy jelszó!" });
        }
        const token = jwt.sign({ id: user.id, nev: user.username }, process.env.JWT_SECRET, { expiresIn: '1h'});
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: false, // ez false, mert http-n vagyunk és nem https-en
            maxAge: 3600000, // 1 óráig tárolja ha minden igaz
            sameSite: 'Strict'
        });
        usersReceivingUnreadPushNotifications.delete(user.id);
        const firstTimeLoggedIn = await UserDAO.hasEverLoggedIn(user.id);
        if(firstTimeLoggedIn) {
            NotificationService.pushNotification(
                user.id,
                "Köszöntünk az rfsocial oldalán!",
                "Örülünk, hogy itt vagy! Fedezd fel az oldalt bátran, írd meg az első bejegyzésed. Ha bármi kérdésed, problémád akad írj nyugodtan támogatói csapatunknak a support@rfsocial.hu email címen!",
                NotificationInteraction.UNDEFINED,
                null,
                ""
            );
        }
        const lastOnlineUpdated = await UserDAO.updateLastOnlineStatus(user.id);
        if(!lastOnlineUpdated) {
            console.log("Nem sikerült a felhasználó legutóbbi elérhetőségi státuszának frissítése!");
        }
        res.status(200).json({ message: "Sikeres bejelentkezés" });
    } catch(error) {
        console.log(error);
        res.status(500).json({ message: "Hiba történt a bejelentkezés során!", error });
    }
};

const logout = async(req, res) => {
    try {
        const token = req.cookies.jwt;
        const user = jwt.verify(token, process.env.JWT_SECRET);
        const lastOnlineUpdated = await UserDAO.updateLastOnlineStatus(user.id);
        if(!lastOnlineUpdated) {
            console.log("Nem sikerült a felhasználó legutóbbi elérhetőségi státuszának frissítése!");
        }
        usersReceivingUnreadPushNotifications.delete(user.id);
        onlineUsersId.delete(user.id);
    } catch(error) {
        console.log(`Hiba a kijelentkezés során: ${error}`);
    }
    res.clearCookie('jwt', {
        httpOnly: true,
        secure: false,
        sameSite: 'Strict',
        path: '/'
    });
    res.redirect(302, '/login')
}

module.exports = { register, login, logout };