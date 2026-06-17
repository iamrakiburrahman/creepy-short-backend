// dashboard.router.ts
import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middleware/auth';
import { DashboardController } from './dashboard.controller';

const router = express.Router();

router.get(
     '/overview',
     auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
     DashboardController.overview,
);
router.get(
     '/user-growth',
     auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
     DashboardController.userGrowth,
);
router.get(
     '/top-watched',
     auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
     DashboardController.topWatched,
);
router.get(
     '/production-report',
     auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
     DashboardController.getProductionReport,
);
router.get(
     '/revenue',
     auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
     DashboardController.getRevenue,
);
export const DashboardRouter = router;
