import express, { Router } from 'express';
import { AdManagementRoutes } from '../app/modules/adManagement/adManagement.route';
import { AdminRoutes } from '../app/modules/admin/admin.route';
import { AuthRouter } from '../app/modules/auth/auth.route';
import { BookmarkRoutes } from '../app/modules/bookmark/bookmark.routes';
import { CategoryRoutes } from '../app/modules/category/category.route';
import { DashboardRouter } from '../app/modules/dashbaord/dashboard.route';
import { FaqRoutes } from '../app/modules/faq/faq.route';
import { FcmTokenRoutes } from '../app/modules/fcmToken/fcmToken.route';
import { FeedbackRoutes } from '../app/modules/feedback/feedback.route';
import { LikeRoutes } from '../app/modules/like/like.routes';
import { MovieManagementRouter } from '../app/modules/movieManagement/movieManagement.route';
import { NotificationRoutes } from '../app/modules/notification/notification.routes';
import { PackageRoutes } from '../app/modules/package/package.routes';
import { ReminderRoute } from '../app/modules/reminder/reminder.route';
import { SeasonManagementRouter } from '../app/modules/seasonManagement/seasonManagement.route';
import SettingsRouter from '../app/modules/settings/settings.route';
import { SubCategoryRoutes } from '../app/modules/subCategory/subCategory.route';
import { SubscriptionRoutes } from '../app/modules/subscription/subscription.routes';
import { TrailerRoutes } from '../app/modules/trailer/trailer.route';
import { UserRouter } from '../app/modules/user/user.route';
import { UserManagementsRouter } from '../app/modules/userManagements/userManagements.router';
import { VideoManagementRoutes } from '../app/modules/videoManagement/videoManagement.route';
import { DynamicContentRoutes } from '../app/modules/websiteLogo/dynamicContent.route';

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
     {
          path: '/subcategory',
          route: SubCategoryRoutes,
     },
     {
          path: '/trailer',
          route: TrailerRoutes,
     },
     {
          path: '/movie-management',
          route: MovieManagementRouter,
     },
     {
          path: '/movies',
          route: MovieManagementRouter,
     },
     {
          path: '/season-management',
          route: SeasonManagementRouter,
     },
     {
          path: '/video-management',
          route: VideoManagementRoutes,
     },
     {
          path: '/video',
          route: VideoManagementRoutes,
     },
     {
          path: '/bookmark',
          route: BookmarkRoutes,
     },
     {
          path: '/faq',
          route: FaqRoutes,
     },
     {
          path: '/feedback',
          route: FeedbackRoutes,
     },
     {
          path: '/package',
          route: PackageRoutes,
     },
     {
          path: '/reminder',
          route: ReminderRoute,
     },
     {
          path: '/ad-management',
          route: AdManagementRoutes,
     },
     {
          path: '/ad',
          route: AdManagementRoutes,
     },
     {
          path: '/notification',
          route: NotificationRoutes,
     },
     {
          path: '/like',
          route: LikeRoutes,
     },
     {
          path: '/dynamic-content',
          route: DynamicContentRoutes,
     },
     {
          path: '/subscription',
          route: SubscriptionRoutes,
     },
     {
          path: '/dashboard',
          route: DashboardRouter,
     },
     {
          path: '/fcmToken',
          route: FcmTokenRoutes,
     },
];

routes.forEach((element) => {
     if (element?.path && element?.route) {
          router.use(element?.path, element?.route);
     }
});

export default router;
