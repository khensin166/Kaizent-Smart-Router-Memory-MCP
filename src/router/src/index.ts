import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.KAIZENT_ROUTER_PORT || 3000;
const LITELLM_URL = process.env.LITELLM_URL || 'http://litellm:4000';

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'kaizent-router' });
});

// Proxy route to LiteLLM (Basic passthrough for now)
app.post('/v1/chat/completions', async (req: Request, res: Response) => {
  try {
    // Here we can add custom Kaizent routing logic, e.g., model fallback, injecting tools, etc.
    const litellmResponse = await axios.post(`${LITELLM_URL}/v1/chat/completions`, req.body, {
      headers: {
        'Authorization': `Bearer ${process.env.KAIZENT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      responseType: 'stream' // Support streaming
    });

    // Forward headers and status
    res.status(litellmResponse.status);
    for (const [key, value] of Object.entries(litellmResponse.headers)) {
      res.setHeader(key, value as string);
    }

    // Pipe response
    litellmResponse.data.pipe(res);
  } catch (error: any) {
    console.error('Error proxying to LiteLLM:', error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Kaizent Router running on port ${PORT}`);
});
