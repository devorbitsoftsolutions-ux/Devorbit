import { Router } from 'express';

const router = Router();

let currentTheme: string = 'light';

router.get('/', (_req, res) => {
  res.json({ theme: currentTheme });
});

router.post('/', (req, res) => {
  const { theme } = req.body;
  if (theme !== 'light' && theme !== 'dark') {
    return res.status(400).json({ error: 'Theme must be "light" or "dark"' });
  }
  currentTheme = theme;
  res.json({ theme: currentTheme });
});

export default router;
