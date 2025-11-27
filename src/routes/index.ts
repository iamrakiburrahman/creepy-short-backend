import express, { Router } from 'express';
import { UserRouter } from '../app/modules/user/user.route';
import { AuthRouter } from '../app/modules/auth/auth.route';
import SettingsRouter from '../app/modules/settings/settings.route';
import { AdminRoutes } from '../app/modules/admin/admin.route';
import { UserManagementsRouter } from '../app/modules/userManagements/userManagements.router';
import { CategoryRoutes } from '../app/modules/category/category.route';
import { TrailerRoutes } from '../app/modules/trailer/trailer.route'

const router = express.Router();
const routes: { path: string; route: Router }[] = [
     {
          path: '/auth',
          route: AuthRouter,
     },
     {
          path: '/users',
          route: UserRouter,
     },
     {
          path: '/settings',
          route: SettingsRouter,
     },
     {
          path: '/admin',
          route: AdminRoutes,
     },
     {
          path: '/user-management',
          route: UserManagementsRouter,
     },
     {
          path: '/category',
          route: CategoryRoutes,
     },
];

routes.forEach((element) => {
     if (element?.path && element?.route) {
          router.use(element?.path, element?.route);
     }
});

export default router;
