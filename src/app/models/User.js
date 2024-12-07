class User {
    constructor(
        id,
        password,
        username,
        email,
        profile_picture,
        registration_timestamp,
        introduction,
        last_online,
        profile_public,
        date_of_birth,
        moderator
    ) {
        this.id = id;
        this.password = password;
        this.username = username;
        this.email = email;
        this.profile_picture = profile_picture;
        this.registration_timestamp = registration_timestamp;
        this.introduction = introduction;
        this.last_online = last_online;
        this.profile_public = profile_public;
        this.date_of_birth = date_of_birth;
        this.moderator = moderator;
    }
}

module.exports = User;