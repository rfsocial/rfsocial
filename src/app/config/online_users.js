// Az online felhasználók azonosítóinak tárolása
// azért kell külön fájlba, mert nem szereti ha a server.js-ből importálok be, körkörös függőség alakul ki (?)

const onlineUsersId = new Set();

module.exports = onlineUsersId;