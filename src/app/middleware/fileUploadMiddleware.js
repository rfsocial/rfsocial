const UserDAO = require('../dao/UserDAO');
const express = require("express");
const multer = require("multer");
const {json} = require("express");
const {idleTimeoutMillis} = require("pg/lib/defaults");
const Uploader = express();
const profilePic = require("../controllers/profileController");
//const storage = require('../controllers/fileUploadController');

multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, "../../uploads");

    },
    filename: function(req, file, cb){
        cb(null, file.originalname);
    }

});
const upload = multer({dest: "../../uploads", fileSize: 10000});
Uploader.post("/api/upload", upload.single("file"), (req, res)=>{
    res.json({status: "sikeres feltoltes"});
    //profilePic.editProfile
    //UserDAO.updateUserById(user.id, file.path);
});


/*Uploader.use((error, req, res, next) => {
    if(error instanceof multer.MulterError){
        if(error.code == "LIMIT_FILE_SIZE"){
            return res.json({
               message:  "A fájl túl nagy." , });
            }
        if(error.code == "LIMIT_FILE_COUNT"){
            return res.json({
                message:  "Túl sok fájl." , });
        }
        if(error.code == "LIMIT_UNEXPECTED_FILE"){
            return res.status(400).json({
                message:  "A fájlnak képnek kell lennie" , });
        }
    }
});*/

//Uploader.listen(7000, () => console.log("listening on port 7000"));

module.exports = Uploader;
