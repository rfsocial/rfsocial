const userDao = require('../dao/UserDAO');
const jwt = require("jsonwebtoken");
const UserDAO = require("../dao/UserDAO");
const bcrypt = require('bcrypt');
const converter = require("../constants/DateConverter")
const {convertDateToHtmlFormat} = require("../constants/DateConverter");


const getSettings = async (req, res) => {
    const userData = await userDao.getUserById(req.user.id);
    const formattedDate = convertDateToHtmlFormat(userData.date_of_birth);

    res.render('../pages/settings-template', {
        profile_picture: userData.profile_picture,
        username: userData.username,
        introduction: userData.introduction,
        dob: formattedDate,
        isPublic: userData.profile_public
    })
};

const updateSettings = async(req, res) => {
    const id = req.user.id;
    const {
        username,
        introduction,
        date_of_birth,
        current_password,
        new_password,
        profile_visibility
    } = req.body;
    try {
        const user = await UserDAO.getUserByName(username);
        if(user && user.id !== id) {
            // felhasználónév foglalt
            return res.status(400).json({ code: 1 });
        }
        // bcrypt.compare(password, user.password);
        const passMatch = await bcrypt.compare(current_password, user.password);
        if(!passMatch){
            // rossz jelszó
            return res.status(400).json({ code: 2 })
        }

        console.log("server " + profile_visibility)

        if(new_password !== null) {
            console.log(`új jelszó: ${new_password}`);
        }

        let hashedPassword;
        if(new_password === null || new_password.length === 0) {
            console.log("new_password is null");
            hashedPassword = await bcrypt.hash(current_password, 10);
        } else {
            console.log("Új jelszó: " + new_password);
            hashedPassword = await bcrypt.hash(new_password, 10);
        }
        /*let hashedPassword = new_password == null ?
            await bcrypt.hash(current_password, 10) :
            await bcrypt.hash(new_password, 10);*/

        const updatedUser = await UserDAO.updateUserById(
            id,
            '../../images/pfp-placeholder.png',
            username,
            introduction,
            date_of_birth,
            hashedPassword,
            profile_visibility
        );
        if(updatedUser) {
            return res.status(200).json(updatedUser);
        }
        return res.status(404).json({ message: 'Felhasználó nem található!' });
    } catch(error) {
        return res.status(500).json({ message: 'Hiba történt a felhasználó adatainak frissítése során! ' + error.toString() });
    }
};

module.exports = { getSettings, updateSettings };