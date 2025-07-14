import express from 'express';
import { AppleController } from '../controllers/appleController';
import { validateRequest } from '../middleware/validateRequest';

const router = express.Router();

router.post('/login',
  validateRequest({
    body: { idToken: { type: 'string', required: true } }
  }),
  AppleController.login
);

export default router; 