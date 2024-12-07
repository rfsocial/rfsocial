const UserDAO = require('../dao/UserDAO');
const User = require('../models/User');
const PostDAO = require('../dao/PostDAO');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const onlineUsersId = require('../config/online_users');
const DateConverter = require('../constants/DateConverter');
const postDAO = require("../dao/PostDAO");
const FriendsDAO = require("../dao/FriendsDAO");

const FriendStatus = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    NOT_EXIST: 'not-exist'
}

const renderProfileById = async(req, res, userId, isOwnProfile) => {
    const userProfileData = await UserDAO.getUserById(userId);
    let isOnline;
    let statusLabel = "Online";
    let friendStatus;
    let userFriendsAsUsers = [];
    const userFriends = await FriendsDAO.listFriends(userId);
    if(userFriends && userFriends.length > 0) {
        // felhasználó ismerőseinek átalakítása User példányokká
        userFriendsAsUsers = await Promise.all(userFriends.map(async row => {
            return UserDAO.getUserById(row.ordered_friend_id);
        }));
    }
    if(isOwnProfile) {
        // Ha a felhasználó a saját profiljára kattint akkor az isOnline egyértelműen true
        isOnline = true;
    } else {
        // Ha más profiljára kattint akkor leellenőrzi hogy online-e az a felhasználó
        // ha nem online akkor lekéri a legutóbbi elérhetőségét
        if(onlineUsersId.has(userId)) {
            isOnline = true;
        } else {
            isOnline = false;
            const lastOnlineDate = await UserDAO.getUserLastOnlineStatusById(userId);
            if(lastOnlineDate === undefined || lastOnlineDate === null) {
                statusLabel = `Még soha nem jelentkezett be`;
            } else {
                const lastOnlineAsRelative = DateConverter.convertDateToRelativeTime(lastOnlineDate);
                statusLabel = `Utoljára elérhető: ${lastOnlineAsRelative}`;
            }
        }

        const row = await FriendsDAO.getFriend(Number(userId), Number(req.user.id));
        if(row) {
            if(row.status === "accepted") {
                friendStatus = FriendStatus.ACCEPTED
            } else if(row.status === "pending") {
                friendStatus = FriendStatus.PENDING;
            }
        } else {
            friendStatus = FriendStatus.NOT_EXIST;
        }
    }

    const userPosts = await PostDAO.getUserPostsById(userId);
    const userCommentCount = await PostDAO.getUserCommentCount(userId);

    const isoRegistrationDate = DateConverter.convertDateToHtmlFormat(userProfileData.registration_timestamp);
    const isoBirthOfDate = DateConverter.convertDateToHtmlFormat(userProfileData.date_of_birth);

    res.render('../pages/profile-template', {
        isOwnProfile: isOwnProfile,
        profileImg: userProfileData.profile_picture,
        isModerator: userProfileData.moderator,
        username: userProfileData.username,
        isOnline: isOnline,
        friendStatus: friendStatus, // ez magát az elemet tartalmazza, hogy melyik
        FriendStatus: FriendStatus, // ez csak a konstans elemeket leírását tartalmazza
        friendsCount: userFriendsAsUsers.length,
        friends: userFriendsAsUsers,
        isPublic: userProfileData.profile_public,
        introduction: userProfileData.introduction,
        dateOfBirth: isoBirthOfDate,
        registrationDate: isoRegistrationDate,
        postCount: userPosts.length,
        commentCount: userCommentCount,
        userId: userId,
        statusLabel: statusLabel
    });
}

const getProfile = async(req, res) => {
    try {
        // azért != és nem !== mert az egyik string a másik pedig int így pedig érték alapján ellenőrzi
        if(req.params.id && req.params.id != req.user.id) {
            // más profil megtekintése
            await renderProfileById(req, res, req.params.id, false);
        } else {
            // saját profil megtekintése
            await renderProfileById(req, res, req.user.id, true);
        }
    } catch(error) {
        return res.status(500).json({ message: 'Hiba történt a felhasználó lekérése során!', error: error.toString() });
    }
}

const deleteProfile = async(req, res) => {
    const id = req.user.id;
    try {
        const result = UserDAO.deleteUserById(id);
        if(result) {
            return res.status(204).send();
        }
        return res.status(404).json({ message: 'Felhasználó nem található!' });
    } catch(error) {
        return res.status(500).json({ message: 'Hiba történt a felhasználó törlése során!' });
    }
};

const editProfile = async(req, res) => {
    const id = req.user.id;
    const {
        profile_picture,
        username,
        introduction,
        date_of_birth,
        password,
        profile_public
    } = req.body;
    try {
        const user = await UserDAO.getUserByName(username);
        if(user && (user.id).toString() !== id) {
            return res.status(400).json({ message: "Ez a felhasználónév már foglalt!" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const updatedUser = await UserDAO.updateUserById(
            id,
            profile_picture,
            username,
            introduction,
            date_of_birth,
            hashedPassword,
            profile_public
        );
        if(updatedUser) {
            return res.status(200).json(updatedUser);
        }
        return res.status(404).json({ message: 'Felhasználó nem található!' });
    } catch(error) {
        return res.status(500).json({ message: 'Hiba történt a felhasználó adatainak frissítése során!' });
    }
};

module.exports = { getProfile };