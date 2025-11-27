import express from 'express';
import { TrailerController } from './trailer.controller';
import { TrailerValidations } from './trailer.validation';
import validateRequest from '../../middleware/validateRequest';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enum/user';


const router = express.Router();

router.get(
  '/',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  TrailerController.getAllTrailers
);

router.get(
  '/:id',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  TrailerController.getSingleTrailer
);

router.post(
  '/',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  
  validateRequest(TrailerValidations.createTrailerZodSchema),
  TrailerController.createTrailer
);

router.patch(
  '/:id',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  
  validateRequest(TrailerValidations.updateTrailerZodSchema),
  TrailerController.updateTrailer
);

router.delete(
  '/:id',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  TrailerController.deleteTrailer
);

export const TrailerRoutes = router;