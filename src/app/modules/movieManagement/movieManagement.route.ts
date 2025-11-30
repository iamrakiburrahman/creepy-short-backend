import { Router } from 'express';
import { MovieController } from './movieManagement.controller';

const router = Router();

router.post('/create-movie', MovieController.createMovieToDB);
router.get('/get-all-movies', MovieController.getAllMoviesFromDB);
router.get('/get-movie/:id', MovieController.getMovieFromDB);
router.put('/update-movie/:id', MovieController.updateMovieFromDB);
router.delete('/delete-movie/:id', MovieController.deleteMovieFromDB);

export const MovieRouter = router;
