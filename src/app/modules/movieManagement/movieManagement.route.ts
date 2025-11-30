import { Router } from 'express';
import { MovieController } from './movieManagement.controller';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';

const router = Router();

router.post('/create', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), MovieController.createMovie);
router.get('/get-movies', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), MovieController.getAllMoviesFromDB);
router.get('/get-movie/:id', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), MovieController.getMovieFromDB);
router.put('/update-movie/:id', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), MovieController.updateMovieFromDB);
router.delete('/delete-movie/:id', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), MovieController.deleteMovieFromDB);

export const MovieRouter = router;
