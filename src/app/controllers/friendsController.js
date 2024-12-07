const FriendsDAO = require('../dao/FriendsDAO');
const UserDAO = require('../dao/UserDAO');
const NotificationService = require('../services/NotificationService');
const NotificationInteraction = require('../constants/NotificationInteraction');

/**
 * Ismerős hozzáadása.
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const addFriend = async(req, res) => {
    const { friendId } = req.body;
    try {
        const added = await FriendsDAO.addFriend(req.user.id, friendId);
        const userData = await UserDAO.getUserById(req.user.id);
        const friendData = await UserDAO.getUserById(friendId);
        if(added) {
            NotificationService.pushNotification(
                req.user.id,
                "Ismerős jelölés elküldve!",
                `A ${friendData.username} nevű felhasználót ismerősnek jelölted!`,
                NotificationInteraction.UNDEFINED,
                null,
                "/images/friend.png"
            );
            NotificationService.pushNotification(
                friendId,
                `${userData.username} ismerősnek jelölt!`,
                "",
                NotificationInteraction.FRIEND_REQUEST,
                req.user.id,
                "/images/friend.png"
            );
            return res.status(200).json({ message: "Ismerős kérés elküldve!" });
        } else {
            return res.status(500).json({ message: "Hiba történt az ismerős kérés elküldése során!" });
        }
    } catch (err){
        console.error('Hiba (friendsController.addFriend):', err);
        res.status(500);
    }

}

/**
 * Ismerős eltávolítása.
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const removeFriend = async(req, res) => {
    const { friendId } = req.body;
    try {
        const result = await FriendsDAO.removeFriend(req.user.id, friendId);
        if(result) {
            return res.status(200).json({ message: "Ismerős törölve!" });
        } else {
            return res.status(400).json({ message: "Hiba az ismerős törlése során!" });
        }
    } catch (err) {
        console.error('HIBA (friendsController.removeFriend):', err);
        res.status(500).json({ message: "Hiba az ismerős törlése során!" });;
    }
}
/**
 * Ismerős megerősítése
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const friendConfirm = async(req, res) => {
    const { userId, friendId } = req.body;
    try {
        const result = await FriendsDAO.friendConfirm(userId, friendId);

        if (result) {
            return res.status(200).json({ message: "Ismerős hozzáadva! Status: accepted" });
        } else {
            return res.status(400).json({ message: "Hiba az ismerős jelölés elfogadása során!" });
        }
    } catch (err) {
        console.error('HIBA (friendsController.friendConfirm):', err);
        res.status(500);
    }
}

/**
 * Ismerősök kilistázása.
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const listFriends = async (req, res) => {
    const {userId} = req.body;
    try {
        const result = await FriendsDAO.listFriends(userId);
        if (result) {
            return res.status(200).json({ message: "Ismerősök lekérve!" });
        } else {
            return res.status(400).json({ message: "Hiba az ismerősök lekérése során!" });
        }
    } catch (err){
        console.error('Hiba friendsController.listFriends:', err);
        res.status(500).json({ message: "Hiba az ismerősök lekérése során!" });
    }
}

/**
 * Ismerős lekérése.
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const getFriend = async (req, res) => {
    const { userId, friendId } = req.body;
    try {
        const friend = await FriendsDAO.getFriend(userId, friendId);
        return res.status(200).json(friend);
    } catch (err) {
        console.error('HIBA (friendsController.getFriend):', err);
        res.status(500).json({ message: "Hiba a friends rekord lekérése során!" });
    }
}

module.exports = { addFriend, removeFriend, friendConfirm, listFriends, getFriend };