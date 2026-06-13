let apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

if (apiBase && !apiBase.startsWith('http://') && !apiBase.startsWith('https://')) {
  // If it is a hostname from Render fromService (e.g., 'walrus-backend-bsqb') and has no domain suffix
  if (!apiBase.includes('.')) {
    apiBase = `https://${apiBase}.onrender.com/api`;
  } else {
    apiBase = `https://${apiBase}/api`;
  }
}

export const API_BASE = apiBase;
