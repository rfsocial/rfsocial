const NotificationDAO = require('../dao/NotificationDAO');
const NotificationInteraction = require('../constants/NotificationInteraction');
const NotificationService = require('../services/NotificationService');
const PostDAO = require("../dao/PostDAO");
const UserDAO = require("../dao/UserDAO");
const FriendsDAO = require("../dao/FriendsDAO");

// ebben tárolja azoknak a felhasználóknak az id-jét akik már megkapták a nem olvasott
// értesítéseknek a pusholását, hogy ne történjen a pusholás duplikáltan ha újratölti az oldalt
const usersReceivingUnreadPushNotifications = new Set();

const removeNotification = async(req, res) => {
    const notificationId = req.params.id;
    try {
        const success = await NotificationDAO.deleteNotificationById(notificationId);
        if(success) {
            res.status(200).json({ message: 'Értesítés törölve!' });
        } else {
            res.status(404).json({ message: 'Értesítés nem található!' });
        }
    } catch(error) {
        res.status(500).json({ message: 'Hiba történt az értesítés törlése során!' });
    }
}

const getNotificationRead = async(req, res) => {
    const notificationId = req.params.id;
    try {
        const notification = await NotificationDAO.getNotificationById(notificationId);
        if(notification) {
            res.status(200).json({ read: notification.read });
        } else {
            res.status(404).json({ message: 'Értesítés nem található!' });
        }
    } catch(error) {
        res.status(500).json({ message: 'Hiba történt az értesítés lekérése során!' });
    }
}

const setNotificationRead = async(req, res) => {
    const notificationId = req.params.id;
    const { read } = req.body;
    try {
        const notification = await NotificationDAO.setNotificationReadById(notificationId, read);
        if(notification) {
            res.status(200).json({ message: 'Értesítés frissítve!' });
        } else {
            res.status(404).json({ message: 'Értesítés nem található!' });
        }
    } catch(error) {
        res.status(500).json({ message: 'Hiba történt az értesítés frissítése során!' });
    }
}

const getUserNotifications = async(req, res) => {
    const userId = req.user.id;
    try {
        const notifications = await NotificationDAO.getNotificationsByUserId(userId);
        // értesítések rendezése dátum szerint
        notifications.sort((a, b) => {
            return new Date(b.created_at) - new Date(a.created_at);
        });
        const unreadNotificationsCount = notifications.filter(notification => !notification.read).length;
        let notificationsLabel;
        if(unreadNotificationsCount > 0) {
            notificationsLabel = `${unreadNotificationsCount} olvasatlan értesítésed van`;
        } else {
            notificationsLabel = "Nincs olvasatlan értesítésed"
        }
        const notificationsTitle = notifications.length > 0 ? `Értesítések: (${notifications.length})` : `Értesítések`;
        res.render('../pages/notifications', {
            title: notificationsTitle,
            notifications,
            notificationsLabel,
            NotificationInteraction: NotificationInteraction
        });
    } catch(error) {
        res.status(500).json({ message: 'Hiba történt az értesítések lekérése során!' });
    }
}


const handleNotificationInteraction = async(req, res) => {
    const { userId, notificationId, interactionType, interactionStatus, relationId } = req.body;
    try {
        switch(interactionType) {
            case "friend-request":
                if(interactionStatus) {
                    await FriendsDAO.friendConfirm(relationId, userId);
                    res.status(200).json({ message: 'Ismerősnek jelölés elfogadva!' });
                    const friendData = await UserDAO.getUserById(userId);
                    NotificationService.pushNotification(
                        relationId,
                        `Ismerős jelölésed elfogadva!`,
                        `${friendData.username} mostantól az ismerősöd`,
                        NotificationInteraction.UNDEFINED,
                        null,
                        "/images/friend.png"
                    );
                } else {
                    await FriendsDAO.removeFriend(userId, relationId);
                    res.status(200).json({ message: 'Ismerősnek jelölés elutasítva!' });
                }
                const notificationDeleted = await NotificationDAO.deleteNotificationById(notificationId);
                if(!notificationDeleted) res.status(500).json({ message: 'Hiba történt az értesítés törlése során!' });
                break;
            /*case "view":
                const post = await postDAO.getPostById(relationId);
                post.comments = await postDAO.getComments(relationId);
                post.reactions = await postDAO.getReactions(relationId);
                return res.render('../pages/post-template', { posts: post, isBackNeeded: true });*/
        }
    } catch(error) {
        res.status(500).json({ message: 'Hiba történt az értesítés interaktálása során!' });
    }
}

const pushUnreadNotifications = async(req, res) => {
    try {
        if(usersReceivingUnreadPushNotifications.has(req.user.id)) {
            res.status(200).json({ message: "Olvasatlan értesítéseket már megkapta a felhasználó!" });
        } else {
            const unreadNotifications = await NotificationDAO.getUnreadNotificationsByUserId(req.user.id);
            if(unreadNotifications.length > 1) {
                NotificationService.pushTemporaryNotification(
                    req.user.id,
                    `${unreadNotifications.length} olvasatlan értesítésed van!`,
                    "",
                    ""
                );
            } else if(unreadNotifications.length === 1) {
                NotificationService.pushTemporaryNotification(
                    req.user.id,
                    unreadNotifications[0].title,
                    unreadNotifications[0].text,
                    unreadNotifications[0].picture_url
                );
            }
            usersReceivingUnreadPushNotifications.add(req.user.id);
            res.status(200).json({ message: "Olvasatlan értesítések pusholva!" });
        }
    } catch(error) {
        res.status(500).json({ message: 'Hiba történt a nem olvasott értesítések lekérése/pusholása során!' });
    }
}

module.exports = {
    removeNotification,
    setNotificationRead,
    handleNotificationInteraction,
    getUserNotifications,
    pushUnreadNotifications,
    usersReceivingUnreadPushNotifications
};