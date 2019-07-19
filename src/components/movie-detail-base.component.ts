import { Movie } from '../entities/movie';

export abstract class MovieDetailBaseComponent {
  abstract setMovie(movie: Movie);
}
