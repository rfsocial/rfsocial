CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    profile_picture VARCHAR(255),
    registration_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    introduction VARCHAR(255),
    last_online TIMESTAMP,
    profile_public BOOLEAN DEFAULT TRUE,
    date_of_birth TIMESTAMP,
    moderator BOOLEAN DEFAULT FALSE
);

CREATE TABLE Notification (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    text VARCHAR(255) NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    user_id INT,
    interaction_type VARCHAR(50),
    link_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    picture_url VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE Post (
    id SERIAL PRIMARY KEY,
    attachment VARCHAR(255),
    content VARCHAR(1024) NOT NULL,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE Comment (
    id SERIAL PRIMARY KEY,
    content VARCHAR(1024) NOT NULL,
    post_id INT,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES Post(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE Reaction (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES Post(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES Users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (post_id, user_id)
);

CREATE TABLE Report (
    id SERIAL PRIMARY KEY,
    text VARCHAR(255) NOT NULL,
    status BOOLEAN DEFAULT FALSE, -- elfogadott/elutasított
    user_id INT,
    post_id INT,
    comment_id INT,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES Post(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES Comment(id) ON DELETE CASCADE
);

--CREATE TYPE friend_status AS ENUM ('pending', 'accepted');
CREATE TABLE Friends (
    user_id INT,
    friend_id INT,
    status VARCHAR(20) DEFAULT 'pending',
    ordered_user_id INT GENERATED ALWAYS AS (LEAST(user_id, friend_id)) STORED,
    ordered_friend_id INT GENERATED ALWAYS AS (GREATEST(user_id, friend_id)) STORED,
    PRIMARY KEY (ordered_user_id, ordered_friend_id),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE Chatrooms (
    id SERIAL PRIMARY KEY,
    group_chat BOOLEAN DEFAULT FALSE,
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Chatroom_users ( -- Chat-ben résztvevők, egyben van kezelve a privát és a csoportos chat
    chatroom_id INT,
    user_id INT,
    isAdmin BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (chatroom_id) REFERENCES Chatrooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE Messages (
    id SERIAL PRIMARY KEY,
    text VARCHAR(1024) NOT NULL,
    attachment VARCHAR(255) DEFAULT NULL,
    sender_id INT,
    chat_id INT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (sender_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (chat_id) REFERENCES Chatrooms(id) ON DELETE CASCADE
);