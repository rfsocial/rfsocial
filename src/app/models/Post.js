class Post {
    constructor(
        id,
        attachment,
        content,
        user_id,
        created_at,
        username
    ) {
        this.id = id;
        this.attachment = attachment;
        this.content = content;
        this.user_id = user_id;
        this.created_at = created_at;
        this.username = username;
    }
}

module.exports = Post;