/*const UserDAO = req('../dao/UserDao');
const uuid = require("uuid").v4;
const multer = require("multer");
const Uploader = require('../middleware/fileUploadMiddleware');


//fájl átnevezése
const storage = multer.diskStorage({
    destination : (req, file, cb) => {
        cb(null, "../../public/images/");
    }, 
    filename: (req, file, cb) => {
        const {originalName } = file;
        cb(null, `${uuid()} - ${originalName}`);
    },
});
//fájltípus ellenőrzése
const fileFilter = (req, file, cb) => {
    if (file.mimetype.split("/")[0] === 'image'){
        cb(null, true);
    } else {
        cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE"), false);
    }
};

module.exports= {storage, fileFilter};*/
