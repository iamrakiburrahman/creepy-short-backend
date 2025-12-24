import { Router } from 'express';
import { SeasonController } from './seasonManagement.controller';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';

const router = Router();

router.post('/create', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), SeasonController.createSeason);
router.get('/get-seasons', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), SeasonController.getAllSeasonsFromDB);
router.get('/get-season/:id', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), SeasonController.getSeasonFromDB);
router.put('/update-season/:id', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), SeasonController.updateSeasonFromDB);
router.delete('/delete-season/:id', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), SeasonController.deleteSeasonFromDB);
router.get('/get-seasons-by-movie/:id', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), SeasonController.getAllSeasonsForMovie);

export const SeasonManagementRouter = router;
