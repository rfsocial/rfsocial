class Notification {
    constructor(
        id,
        title,
        text,
        read,
        user_id,
        interaction_type,
        link_id,
        created_at,
        picture_url,
        relative_time
    ) {
        this.id = id;
        this.title = title;
        this.text = text;
        this.read = read;
        this.user_id = user_id;
        this.interaction_type = interaction_type;
        this.link_id = link_id;
        this.created_at = created_at;
        this.picture_url = picture_url;
        this.relative_time = relative_time
    }
}

module.exports = Notification;