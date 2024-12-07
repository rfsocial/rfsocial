class Message {
    constructor(id, text, attachment, sender_id, chat_id, date, read) {
        this.id = id;
        this.text = text;
        this.attachment = attachment;
        this.sender_id = sender_id;
        this.chat_id = chat_id;
        this.date = date;
        this.read = read;
    }
}

module.exports = Message;