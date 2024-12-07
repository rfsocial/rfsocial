class ChatroomUser {
    constructor(chatroom_id, user_id, isAdmin) {
        this.chatroom_id = chatroom_id;
        this.user_id = user_id;
        this.isAdmin = isAdmin;
    }
}

module.exports = ChatroomUser;