const express = require('express');
const multer = require('multer');
const upload =multer({dest: '/uploads'});
const {uploadFile, getFileStream} = require('../controllers/s3Controller');
const route_s3 = express();
const fs = require('fs');
const util = require('util');
const unlinkFile = util.promisify(fs.unlink);


route_s3.get('../../public/images/:key', (req, res) => {
    const key = req.params.key;
    const readStream = getFileStream(key);
    readStream.pipe(res);
})

route_s3.post('../../public/images/', upload.single('image'), async (req, res) =>{
    const file=req.file;
    console.log(file)
    const result = await uploadFile(file);
    await unlinkFile(file.path);
    console.log(file)
    const description = req.body.description;
    res.send({imagePath: `../../public/images/${result.Key}`})
})
