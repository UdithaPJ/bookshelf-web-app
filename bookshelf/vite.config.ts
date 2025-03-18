import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from "dotenv";

dotenv.config();

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  optimizeDeps: {
    include: ["@mui/icons-material"]
  },
  define: {
    "process.env": process.env
  }
})
