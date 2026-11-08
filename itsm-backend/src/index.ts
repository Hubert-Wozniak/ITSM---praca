import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Pozwala frontendowi na odpytywanie backendu
app.use(cors());
// Pozwala backendowi czytać dane w formacie JSON (np. z naszego formularza)
app.use(express.json());

// Prosty endpoint testowy
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Serwer ITSM działa poprawnie i czeka na bazę danych!' });
});

app.listen(port, () => {
  console.log(`🚀 Serwer działa na porcie http://localhost:${port}`);
});