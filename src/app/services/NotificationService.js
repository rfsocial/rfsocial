const { getSocketInstance } = require('../config/socket');
const NotificationDAO = require('../dao/NotificationDAO');
const NotificationInteraction = require('../constants/NotificationInteraction');
const Notification = require('../models/Notification');
const DateConverter = require('../constants/DateConverter');

class NotificationService {

    /** Valós idejű értesítés küldése adott felhasználónak, mely tárolásra kerül az adatbázisban.
     @param {number} userId - Az értesítés címzettjének id-je (felhasználó)
     @param {string} title - Az értesítés címe.
     @param {string} description - Az értesítés szövege.
     @param {NotificationInteraction} interactionType - Az értesítés interakciójának típusa.
     @param {number} relationId - Az értesítéshez kapcsolódó hivatkozás id-je (pl. felhasználó id, bejegyzés id stb.)
     @param {string} imgUrl - Értesítéshez tartozó kép url-je (mutathat egy felhasználó képére vagy statikus képre is).
     @returns {Notification} - létrehozott értesítés
     */
    static async pushNotification(
        userId,
        title,
        description,
        interactionType,
        relationId,
        imgUrl
    ) {
        try {
            const io = getSocketInstance();
            const createdNotification = await NotificationDAO.create(
                title,
                description,
                userId,
                interactionType,
                relationId,
                imgUrl
            );
            const notificationRoom = `notification-${userId}`;
            io.to(notificationRoom).emit('new-notification', createdNotification);
            // console.log("Értesítés elküldve a felhasználónak!");
            // lehet hogy errort dob ha nem létezik a szoba és nincs fent a felhasználó akinek pusholná az értesítést
            // mindenesetre az értesítést létre fogja hozni az adatbázisban és lementi neki
        } catch(error) {
            console.error(`Hiba történt az értesítés küldése során! ${error}`);
        }
    }

    /** Valós idejű értesítés küldése adott felhasználónak (NEM kerül tárolásra az adatbázisban)
     @param {number} userId - Az értesítés címzettjének id-je (felhasználó)
     @param {string} title - Az értesítés címe.
     @param {string} description - Az értesítés szövege.
     @param {string} imgUrl - Értesítéshez tartozó kép url-je (mutathat egy felhasználó képére vagy statikus képre is).
     @returns {Notification} - létrehozott értesítés
     */
    static async pushTemporaryNotification(
        userId,
        title,
        description,
        imgUrl
    ) {
        try {
            const io = getSocketInstance();
            const createdNotification = new Notification(
                userId,
                title,
                description,
                false,
                userId,
                NotificationInteraction.UNDEFINED,
                null,
                new Date(),
                imgUrl,
                DateConverter.convertDateToRelativeTime(new Date())
            );
            const notificationRoom = `notification-${userId}`;
            io.to(notificationRoom).emit('new-notification', createdNotification);
            // lehet hogy errort dob ha nem létezik a szoba és nincs fent a felhasználó akinek pusholná az értesítést
            // mindenesetre az értesítést létre fogja hozni az adatbázisban és lementi neki
        } catch(error) {
            console.error(`Hiba történt az értesítés küldése során! ${error}`);
        }
    }
}

module.exports = NotificationService;