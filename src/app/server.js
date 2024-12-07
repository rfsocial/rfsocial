/* --- KONSTANSOK, BEÁLLÍTÁSOK --- */
const db_server = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const friendRoutes = require('./routes/friendRoutes');
const express = require('express');
const postRoutes = require('./routes/postRoutes'); // Hozzáadás a postRoutes-hoz
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');
const fileUpload = require('./middleware/fileUploadMiddleware');
const authMiddleware = require('./middleware/authMiddleware');
const PostDAO = require('./dao/PostDAO');
const path = require('path');
const dayjs = require('dayjs');
const http = require('http');
const socketIO = require('socket.io');
const cookieParser = require('cookie-parser');
const app = express();
const server = http.createServer(app);
const { initializeSocket, getSocketInstance } = require('./config/socket');
const PORT = process.env.PORT || 8000;
const multer = require('multer');
const jwt = require("jsonwebtoken");
const upload = multer({dest: '/uploads'});
const onlineUsersId = require('./config/online_users');
const cors = require('cors');

/* Bejegyzések és kommentek lekérési funkció
async function fetchPostsAndComments() {
    try {
        const posts = await PostDAO.getAllPosts();
        await Promise.all(posts.map(async post => {
            post.comments = await PostDAO.getComments(post.id) || [];
            post.reactions = await PostDAO.getReactions(post.id) || [];
        }));
        return posts;
    } catch (error) {
        console.error('Hiba a bejegyzések vagy kommentek lekérése során:', error);
        return [];
    }
}

async function fetchComments(postId) {
    try {
        return await PostDAO.getComments(postId);
    } catch (error) {
        console.error('Hiba a kommentek lekérése során:', error);
        return [];
    }
}*/

// BEÁLLÍTÁSOK
initializeSocket(server);

app.set('views', path.join(__dirname, 'views/pages'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use(cookieParser());

/* --- ROUTE KEZELÉS --- */
app.use('/', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/upload', fileUpload);
app.use('/api/posts', postRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/messages', messageRoutes);

app.get('/', (req, res) => {
    if(req.cookies.jwt){
        res.redirect('/app')
    } else {
        res.redirect('/login');
    }
});

app.get('/app', authMiddleware(), async (req, res) => {
    if (!req.cookies.jwt) {
        return res.redirect('/login');
    }
    try {
        res.render('../index', { userId: req.user.id, isModerator: req.user.moderator });
    } catch (error) {
        console.error('Hiba a bejegyzések betöltése során:', error);
        res.status(500).send('Hiba történt a bejegyzések betöltésekor');
    }
});

/*app.get('/comments', async (req, res) => {
    try {
        const comments = await fetchComments();
        res.render('../partials/comment-template', { comments });
    } catch (error) {
        console.error('Hiba a kommentek megjelenítése során:', error);
        res.status(500).send('Hiba történt a kommentek betöltésekor');
    }
});

app.get('/posts/:postId/comments', async (req, res) => {
    const { postId } = req.params;
    try {
        const comments = await fetchComments(postId); // fetchComments függvény a PostDAO-tól lekéri a kommenteket
        console.log(comments)
        res.render('../partials/comment-template', { postId, comments });
    } catch (error) {
        console.error('Hiba a kommentek lekérése során:', error);
        res.status(500).send('Hiba történt a kommentek betöltésekor.');
    }
});

app.get('/posts', async (req, res) => {
    try {
        const posts = await fetchPostsAndComments();
        res.render('../layouts/posts-layout', { posts });
    } catch (error) {
        console.error('Hiba a posztok megjelenítése során:', error);
        res.status(500).send('Hiba történt a posztok betöltésekor');
    }
});*/

app.get('/login', (req, res) => {
    if(req.cookies.jwt) {
        res.redirect('/app');
    } else {
        res.render('login');
    }
});

app.get('/register', (req, res) => {
    if(req.cookies.jwt) {
        res.redirect('/app');
    } else {
        res.render('register');
    }
});

/*
app.get('/comment', (req, res) => {
    if(req.cookies.jwt) {
        res.render('../partials/comment-template',
            {comments: comments});
    } else {
        res.redirect('/login')
    }
})

app.get('/posts', (req, res) => {
    if(req.cookies.jwt) {
        res.render('../layouts/posts-layout',
            {profile, friends, posts, comments})
    } else {
        res.redirect('/login')
    }
})*/

// Nem található végpont lekezelése, ennek itt legalul kell lennie minden végpont lekezelése után!
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '../public', '404.html'));
});

/* --- SZERVER --- */
const io = getSocketInstance();

// JWT-s azonosítás mielőtt a felhasználó csatlakozna a notification socket szobába (itt tud figyelni a pusholt real-time értesítésekre)
io.use((socket, next) => {
    const cookies = socket.handshake.headers.cookie;
    if(!cookies) {
        const msg = "Nem található süti!";
        console.log(msg);
        return new Error(msg);
    }
    // cookie parser, kiszedi a sütiből a jwt= utáni értéket, mert a cookies változóban egy nagy stringként van az összes süti
    const token = cookies.replace(
        /(?:^|.*;\s*)jwt\s*=\s*([^;]*).*$|^.*$/,
        "$1"
    );
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if(err) {
            const msg = "Érvénytelen token!";
            console.log(msg);
            return new Error(msg);
        }
        socket.user = decoded;
        next();
    })
})

io.on('connection', (socket) => {
    // console.log(`Azonosítás sikeres! Felhasználó csatlakozott! (Szerver)`);
    const notificationRoom = `notification-${socket.user.id}`;
    onlineUsersId.add(socket.user.id.toString());
    socket.join(notificationRoom);
    socket.on('disconnect', () => {
        // console.log('Felhasználó kilépett!');
        socket.leave(notificationRoom);
        onlineUsersId.delete(socket.user.id.toString());
    })

    /* Manuális tesztelésre:
    socket.on('join-room', (room) => {
       socket.join(room);
       console.log("Felhasználó csatlakoztatva a teszt szobához!");
    });

    socket.on('send-test-notification', (notification) => {
        console.log('Teszt értesítés küldése:', notification);
        io.to('test-room').emit('new-notification', notification);
    });

    socket.on('disconnect', () => {
        console.log('Felhasználó kilépett a szobából!');
    });*/
});

server.listen(PORT, () => {
   console.log(`A szerver elindult! Port: ${PORT}`);
});

db_server.connect()
   .then(() => {
      console.log("A szerver csatlakozott a PostgreSQL adatbázis-szerverhez!");
   })
   .catch((err) => console.error(`Hiba történt az adatbázis-szerver kapcsolódása során: ${err}`))

module.exports = server;