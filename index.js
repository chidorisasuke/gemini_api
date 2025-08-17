import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- Konfigurasi Awal ---
const app = express();
const upload = multer({ storage: multer.memoryStorage() }); 
app.use(express.json());

// --- Inisialisasi Model Gemini ---
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- Helper Functions ---
// '''
// How to use Gemini API on Command Prompt
// C:\Users\Yahya Bachtiar\OneDrive\Documents\Improvements\Kodeid\gemini_api>curl -X POST -F "prompt=Tolong transkripsikan audio ini" -F "audio=@doraemon_opening.mp3" http://localhost:3000/generate-from-audio
// {"result":"Aku ingin begini, aku ingin begitu. Ingin ini, ingin itu, banyak sekali. Semua semua semua dapat dikabulkan, dapat dikabulkan dengan kantong ajaib. Aku ingin terbang bebas di angkasa. Hai paling paling bambu. Lah lah lah, aku sayang sekali Doraemon. Lah lah lah, aku sayang sekali Doraemon. Lah lah lah, aku sayang sekali Doraemon.\n"}
// '''

// Helper untuk mengubah file buffer menjadi format Gemini
function fileToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType
    },
  };
}

// BARU: Helper untuk mendapatkan MIME type yang benar dari nama file
function getMimeTypeForFile(filename) {
  const extension = filename.split('.').pop().toLowerCase();
  switch (extension) {
    case 'mp3': return 'audio/mpeg';
    case 'wav': return 'audio/wav';
    case 'ogg': return 'audio/ogg';
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'webp': return 'image/webp';
    case 'heic': return 'image/heic';
    case 'heif': return 'image/heif';
    case 'pdf': return 'application/pdf';
    case 'txt': return 'text/plain';
    default: return 'application/octet-stream'; // Fallback
  }
}

// =============================================================
// ===                    ENDPOINT API                       ===
// =============================================================

// ### 1. ENDPOINT: GENERATE FROM TEXT ###
app.post('/generate-text', async (req, res) => {
  try {
    const { prompt } = req.body;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json({ result: response.text() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ### 2. ENDPOINT: GENERATE FROM IMAGE ###
app.post('/generate-from-image', upload.single('image'), async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!req.file) return res.status(400).json({ error: "No image file uploaded." });

    const mimeType = getMimeTypeForFile(req.file.originalname); // Menggunakan helper baru
    const imageParts = [fileToGenerativePart(req.file.buffer, mimeType)];
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    res.json({ result: response.text() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ### 3. ENDPOINT: GENERATE FROM AUDIO ###
app.post('/generate-from-audio', upload.single('audio'), async (req, res) => {
  try {
    const prompt = req.body.prompt || "Transkripsikan audio berikut:";
    if (!req.file) return res.status(400).json({ error: "No audio file uploaded." });
    
    const mimeType = getMimeTypeForFile(req.file.originalname); // Menggunakan helper baru
    if (mimeType === 'application/octet-stream') {
        return res.status(400).json({ error: `Unsupported audio format: ${req.file.originalname}` });
    }

    const audioParts = [fileToGenerativePart(req.file.buffer, mimeType)];
    const result = await model.generateContent([prompt, ...audioParts]);
    const response = await result.response;
    res.json({ result: response.text() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ### 4. ENDPOINT: GENERATE FROM DOCUMENT ###
app.post('/generate-from-document', upload.single('document'), async (req, res) => {
  try {
    const prompt = req.body.prompt || "Ringkas dokumen berikut:";
    if (!req.file) return res.status(400).json({ error: "No document file uploaded." });

    const mimeType = getMimeTypeForFile(req.file.originalname); // Menggunakan helper baru
    const docParts = [fileToGenerativePart(req.file.buffer, mimeType)];
    const result = await model.generateContent([prompt, ...docParts]);
    const response = await result.response;
    res.json({ result: response.text() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- Menjalankan Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server ready on http://localhost:${PORT}`);
  console.log("Endpoints available: POST /generate-text, POST /generate-from-image, POST /generate-from-audio, POST /generate-from-document");
});