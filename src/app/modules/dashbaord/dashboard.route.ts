// dashboard.router.ts
import express from 'express';
import { DashboardController } from './dashboard.controller';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';

const router = express.Router();

router.get('/overview', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), DashboardController.overview);
router.get('/user-growth', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), DashboardController.userGrowth);
router.get('/top-watched', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), DashboardController.topWatched);

export const DashboardRouter = router;
