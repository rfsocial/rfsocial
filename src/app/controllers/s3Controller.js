require('dotenv').config();
const S3 = require('aws-sdk/clients/s3');
const fs = require('fs');

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.ACCESS_KEY;
const secretKey = process.env.SECRET_KEY;

const s3 = new S3 ({
    bucketRegion,
    accessKey,
    secretKey
});


// fájlfeltöltés metódus az s3-ra
function uploadFile (file){
    const fileStream = fs.createReadStream(file.path);
    const uploadParameters={
    Body: fileStream,
    Bucket: bucketName,
    Key: file.filename
    }
    return s3.upload(uploadParameters).promise();
}
exports.uploadFile=uploadFile;

//fájletöltés metódus, az s3-ról

function getFileStream (fileKey) {
    const downloadParameters ={
        Bucket: bucketName,
        Key: fileKey
    }
    return s3.getObject(downloadParameters).createReadStream();
}
exports.getFileStream = getFileStream;
