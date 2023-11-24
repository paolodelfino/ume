import {
  MoviesGetCreditsCast,
  MoviesGetDetailsGenre,
  TVGetCreditsCast,
  TVGetDetailsGenre,
} from "tmdb-js-node";
import { Ume_Seasons } from "./ume-seasons";

export interface TitleImage {
  imageable_id: number;
  imageable_type: "title" | "episode";
  filename: string;
  type: "cover_mobile" | "poster" | "background" | "logo" | "cover";
  original_url_field: string | null;
}

export type TitleSearch = {
  id: number;
  slug: string;
  name: string;
  score: string;
  sub_ita: number;
  images: TitleImage[];
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

export interface TitleDataPage {
  title: {
    plot: string;
    tmdb_id: number | null;
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
    trailers: {
      id: number;
      name: string;
      youtube_id: string;
    }[];
    images: TitleImage[];
  };
  sliders: {
    name: string;
    label: string;
    titles: TitleSearch[];
  }[];
}

export interface Episode {
  id: number;
  number: number;
  name: string;
  plot: string;
  duration: number;
  images: TitleImage[];
}

export type TitleDetails = Omit<TitleDataPage["title"], "seasons"> & {
  slug: string;
  seasons: Ume_Seasons;
  cast: Promise<(MoviesGetCreditsCast | TVGetCreditsCast)[]> | null;
  genres: Promise<(MoviesGetDetailsGenre | TVGetDetailsGenre)[]> | null;
  related: TitleSearch[] | null;
  id: number;
};
