const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testUpload() {
  try {
    // First login to get token
    console.log('Logging in...');
    const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
      email: 'admin@alnajah.test',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful, token received');
    console.log('Token:', token.substring(0, 20) + '...\n');

    // Create a simple test image
    const testImagePath = path.join(__dirname, '../../public/uploads/test.jpg');
    
    if (!fs.existsSync(testImagePath)) {
      console.log('Test image not found at:', testImagePath);
      return;
    }

    // Create form data
    const form = new FormData();
    form.append('image', fs.createReadStream(testImagePath));

    console.log('Uploading image to /api/uploads/image...');
    
    // Upload the image
    const uploadResponse = await axios.post('http://localhost:4000/api/uploads/image', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('\nUpload successful!');
    console.log('Response:', JSON.stringify(uploadResponse.data, null, 2));
    
  } catch (error) {
    console.error('\nUpload failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testUpload();
