const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const generateUploadURL = async (fileType) => {
  const rawBytes = await crypto.randomBytes(16);
  const fileName = rawBytes.toString('hex');

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
    ContentType: fileType
  };

  const command = new PutObjectCommand(params);
  const uploadURL = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  return {
    uploadURL,
    fileName: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`
  };
};

module.exports = { generateUploadURL };