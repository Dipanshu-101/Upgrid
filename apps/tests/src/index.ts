import axios from 'axios';

const apiUrl = process.env.API_URL || 'http://localhost:5000';

try {
  const response = await axios.post(`${apiUrl}/website`);
  console.log(`POST /website: ${response.status} ${response.data}`);
} catch (error) {
  if (axios.isAxiosError(error)) {
    console.error(`POST /website failed: ${error.response?.status ?? 'no response'}`);
    console.error(error.response?.data ?? error.message);
  } else {
    console.error(error);
  }
  process.exitCode = 1;
}