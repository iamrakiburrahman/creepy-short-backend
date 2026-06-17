import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import { SubscriptionController } from './subscription.controller';
import auth from '../../middleware/auth';
const router = express.Router();

router.get(
     '/',
     auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.USER),
     SubscriptionController.subscriptions,
);
router.get(
     '/details',
     auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
     SubscriptionController.subscriptionDetails,
);
router.get(
     '/transaction-history',
     auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
     SubscriptionController.getTransactionHistory,
);
router.get(
     '/check-access',
     auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
     SubscriptionController.checkAccess,
);
router.post(
     '/create-iap-subscription',
     auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
     SubscriptionController.createCheckoutSessionForApp,
);

export const SubscriptionRoutes = router;
