import { Router } from 'express';
import * as subscriptionController from '../../../controllers/subscription.controller';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/role.middleware';
import { Role } from '../../../utils/enums';

const router = Router();

router.post('/webhook', subscriptionController.webhook);

router.post('/checkout', authenticate, subscriptionController.checkout);

router.get('/me', authenticate, subscriptionController.getMySubscription);

router.get('/billing-history', authenticate, subscriptionController.billingHistory);

router.delete('/me', authenticate, subscriptionController.cancel);

router.get('/', authenticate, authorize(Role.Administrator), subscriptionController.adminList);

export default router;
