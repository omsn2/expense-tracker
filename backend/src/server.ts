import { createServer } from './server/app';

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const app = createServer();

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});

export default app;
