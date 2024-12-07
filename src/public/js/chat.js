document.addEventListener("DOMContentLoaded", async function () {
    try {
        const userId = JSON.parse(document.getElementById('user-data').getAttribute('data-user'));
        console.log('User ID:', userId);
        const response = await fetch(`/api/chat/users/${userId}/chat-messages`);
        if (response.ok) {
            const data = await response.json();
            console.log("response data: " + data);
            window.chatMessages = data.chatMessages;
            setTimeout(() => {
                renderChatList(data.chatMessages);
                setupChatEventListeners();
            }, 0);
        } else if(response.status === 404) {
            const chatContent = document.querySelector('.chat-content');
            const spanElement = document.createElement("span");
            spanElement.innerHTML = "Nincsenek üzenetek!";
            spanElement.style.display = "block";
            spanElement.style.textAlign = "center";
            spanElement.style.color = "gray";
            spanElement.style.fontSize = "1.5rem";
            spanElement.style.marginTop = "10rem";
            chatContent.appendChild(spanElement);
        } else {
            console.error("HIBA (chat-messages):", response.status, response.statusText);
        }
    } catch (err) {
        console.error("HIBA (chat-messages):", err);
    }
});

function renderChatList(chatMessages) {
    const chatContent = document.querySelector('.chat-content');
    chatContent.innerHTML = ''; // Jelenlegi tartalom törlése

    chatMessages.filter(chat => chat.messages && chat.messages.length > 0).forEach(chat => {
        let lastMessage = chat.messages[chat.messages.length - 1];
        let currentDate = new Date();
        let messageDate = new Date(lastMessage.timeSent);
        let formattedDate;

        if (currentDate.toDateString() === messageDate.toDateString()) {
            formattedDate = `${messageDate.getHours()}:${String(messageDate.getMinutes()).padStart(2, '0')}`;
        } else {
            let yesterday = new Date(currentDate);
            yesterday.setDate(yesterday.getDate() - 1);
            formattedDate = yesterday.toDateString() === messageDate.toDateString()
                ? 'tegnap'
                : currentDate.getFullYear() !== messageDate.getFullYear()
                    ? `${messageDate.getFullYear()}.${String(messageDate.getMonth() + 1).padStart(2, '0')}.${String(messageDate.getDate()).padStart(2, '0')}`
                    : `${String(messageDate.getMonth() + 1).padStart(2, '0')}.${String(messageDate.getDate()).padStart(2, '0')}`;
        }

        let senderImage = `../images/${lastMessage.sender.toLowerCase()}-pfp.png`;

        let chatItem = document.createElement('div');
        chatItem.classList.add('chat-item');
        chatItem.innerHTML = `
            <img src="${senderImage}" alt="Profilkép" class="profile-picture"
                 onerror="this.src='../images/pfp-placeholder.png'"
                 loading="eager">
            <div class="message-details">
                <div class="message-header">
                    <p class="username">${chat.chatName}</p>
                    <p class="time-sent">${formattedDate}</p>
                </div>
                <p class="message-preview">
                    ${lastMessage.sender}:
                    ${lastMessage.message.length > 30 ? lastMessage.message.substring(0, 30) + '...' : lastMessage.message}
                </p>
            </div>
        `;

        // Esemény hozzáadása a chatItem-hez
        chatItem.addEventListener('click', function(event) {
            handleChatItemClick(event, chat);  // Az eseménykezelőhöz átadjuk az adott chat adatokat
        });

        chatContent.appendChild(chatItem);
    });
}

function handleChatItemClick(event, chat) {
    const chatContent = document.querySelector('.chat-content');
    chatContent.innerHTML = '';  // A chat megjelenítése előtt ürítjük a tartalmat

    console.log('Chat:', chat.chatName);

    // Jelenlegi chat objektum beállítása
    currentChat = chat;

    // Vissza gomb és input mező láthatóvá tétele
    const backButton = document.getElementById('backButton');
    const chatInputContainer = document.getElementById('chatInputContainer');
    backButton.style.display = 'block';
    chatInputContainer.style.display = 'flex';

    backButton.addEventListener('click', () => {
        fetch(`/api/chat/users/${userId}/chat-messages`) 
            .then(response => response.json())
            .then(data => {
                window.chatMessages = data.chatMessages;
                
                renderChatList(window.chatMessages);
                setupChatItems(); 

                backButton.style.display = 'none';
                chatInputContainer.style.display = 'none';
                chatInputBox.value = '';
                currentChat = null;
            })
            .catch(err => {
                console.error('HIBA (vissza gomb):', err);
            });
    });

    // Ha van üzenet a chatben, akkor azokat megjelenítjük
    if (chat.messages && chat.messages.length > 0) {
        const chatTitleHeader = document.createElement('div');
        chatTitleHeader.classList.add('chat-title-header');
        chatTitleHeader.innerHTML = `
            <img src="${chat.type === 'group' ? `../images/group-${chat.chatName.toLowerCase()}-pfp.png` : `../images/${chat.chatName.toLowerCase()}-pfp.png`}"
                 alt="Profilkép"
                 class="header-profile-picture"
                 onerror="this.src='../images/pfp-placeholder.png'"
                 loading="eager">
            <h2 class="header-chat-name">${chat.chatName}</h2>
            ${chat.type === 'group' ? '<button class="options-button">...</button>' : ''}
        `;
        chatContent.appendChild(chatTitleHeader);

        // Üzenetek megjelenítése
        chat.messages.forEach(msg => {
            const messageElement = document.createElement('div');
            const isUser = msg.sender === userId;
            const messageClass = isUser ? 'messageBox user-box' : 'messageBox receiver-box';

            messageElement.classList.add('message-wrapper');
            messageElement.innerHTML = `
                <div class="${messageClass}">
                    <small class="date">${new Date(msg.timeSent).toLocaleString()}</small>
                    <div class="message-wrapper ${isUser ? 'right' : 'left'}">
                        <img src="../images/${msg.sender.toLowerCase()}-pfp.png" alt="Profilkép" class="chat-profile-picture"
                             onerror="this.src='../images/pfp-placeholder.png'"
                             loading="eager">
                        <div class="message-content">
                            <p class="message-text">${msg.message}</p>
                        </div>
                    </div>
                </div>
            `;

            chatContent.appendChild(messageElement);
        });

        chatContent.scrollTop = chatContent.scrollHeight;  // Görgetés az üzenetek aljára
    }
}


function showMessageModal(id) {
    var modal = document.getElementById("modal")
    modal.style.display = "block";
    chatId = id
}

function closeMessageModal() {
    var modal = document.getElementById("modal")
    modal.style.display = "none";
}

async function sendMessage() {
    try {
        const messageText = document.getElementById('description').value;
        const userId = JSON.parse(document.getElementById('user-data').getAttribute('data-user')).id;
        if (!messageText) return;
        const createChat = await fetch(`api/chat/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ group_chat: false })
        })

        if (!createChat.ok) throw new Error("Hiba");

        const createdChatroom = await createChat.json();

        const createMessageResponse = await fetch(`api/messages`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: messageText,
                attachment: null,
                sender_id: userId,
                chatroom_id: createdChatroom.id
            })
        });

        if (!createMessageResponse.ok) throw new Error("Hiba üzenet");

        const newMessage = await createMessageResponse.json();
        return { chatroom: createdChatroom, message: newMessage };
    } catch (err) {
        console.error("HIBA (sendMessage):", err);
    }

    closeMessageModal();
}