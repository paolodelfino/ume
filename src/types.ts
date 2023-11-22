import { MoviesGetCreditsCast, MoviesGetDetailsGenre } from "tmdb-js-node";

export interface ApiResponse<T> {
  data: T[];
}

export interface MediaImage {
  imageable_id: number;
  imageable_type: "title" | "episode";
  filename: string;
  type: "cover_mobile" | "poster" | "background" | "logo" | "cover";
  original_url_field: string | null;
}

export type MediaSearch = {
  id: number;
  slug: string;
  name: string;
  score: string;
  sub_ita: number;
  images: MediaImage[];
  seasons_count: number;
} & (
  | {
      type: "tv";
      last_air_date: null;
    }
  | {
      type: "movie";
      last_air_date: string;
    }
);

export interface MediaTrailer {
  id: number;
  name: string;
  youtube_id: string;
}

export interface TitleDataPage {
  title: {
    plot: string;
    tmdb_id: number;
    name: string;
    runtime: number | null;
    quality: string;
    type: "movie" | "tv";
    release_date: string;
    status: "Canceled" | "Post Production " | "Returning Series" | "Released";
    seasons_count: number;
    seasons: {
      id: number;
      number: 1;
      title_id: number;
      episodes_count: number;
    }[];
    trailers: MediaTrailer[];
    images: MediaImage[];
  };
  sliders: {
    name: string;
    label: string;
    titles: MediaSearch[];
  }[];
}

export interface Episode {
  id: number;
  number: number;
  name: string;
  plot: string;
  duration: number;
  images: MediaImage[];
}

export interface SeasonDataPage {
  episodes: Episode[];
}

export type MediaDetails = Omit<TitleDataPage["title"], "seasons"> & {
  seasons: {
    number: number;
    episodes: Episode[];
  }[];
  cast: MoviesGetCreditsCast[];
  genres: MoviesGetDetailsGenre[];
  related: MediaSearch[] | null;
};
