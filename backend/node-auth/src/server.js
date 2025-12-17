import dotenv from 'dotenv';
import app from './startup/app.js';

dotenv.config();

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Auth API running on port ${PORT}`);
});
