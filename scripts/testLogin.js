const axios = require('axios');

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:4000/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    console.log('Token:', response.data.token);
    return response.data.token;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
  }
}

testLogin();
