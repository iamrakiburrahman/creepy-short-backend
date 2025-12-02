import { Router } from 'express';
import { MovieController } from './movieManagement.controller';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import fileUploadHandler from '../../middleware/fileUploadHandler';
import parseFileData from '../../middleware/parseFileData';
import { FOLDER_NAMES } from '../../../enums/files';

const router = Router();

router.post('/create', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), fileUploadHandler(), parseFileData(FOLDER_NAMES.IMAGE), MovieController.createMovie);
router.get('/get-movies', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), MovieController.getAllMoviesFromDB);
router.get('/get-movie/:id', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), MovieController.getMovieFromDB);
router.put('/update-movie/:id', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), fileUploadHandler(), parseFileData(FOLDER_NAMES.IMAGE), MovieController.updateMovieFromDB);
router.delete('/delete-movie/:id', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), MovieController.deleteMovieFromDB);

export const MovieRouter = router;
