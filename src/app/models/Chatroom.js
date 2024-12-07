class Chatroom {
    constructor(id, group_chat, name, created_at) {
        this.id = id;
        this.group_chat = group_chat;
        this.name = name;
        this.created_at = created_at;
    }
}

module.exports = Chatroom;