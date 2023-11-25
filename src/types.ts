import {
  MoviesGetCreditsCast,
  MoviesGetDetailsGenre,
  TVGetCreditsCast,
  TVGetDetailsGenre,
} from "tmdb-js-node";
import { Ume_Seasons } from "./ume-seasons";

export interface Title_Image {
  imageable_id: number;
  imageable_type: "title" | "episode";
  filename: string;
  type: "cover_mobile" | "poster" | "background" | "logo" | "cover";
  original_url_field: string | null;
}

export type Title_Search = {
  id: number;
  slug: string;
  name: string;
  score: string | null;
  images: Title_Image[];
  seasons_count: number;
  type: "tv" | "movie";
};

export interface Title_Data_Page {
  title: {
    score: string | null;
    plot: string;
    tmdb_id: number | null;
    name: string;
    runtime: number | null;
    quality: string;
    type: "movie" | "tv";
    release_date: string;
    status: "Canceled" | "Post Production" | "Returning Series" | "Released";
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
    images: Title_Image[];
  };
  sliders: {
    name: string;
    label: string;
    titles: Title_Search[];
  }[];
}

export interface Episode {
  id: number;
  number: number;
  name: string;
  plot: string;
  duration: number;
  images: Title_Image[];
}

export type Title_Details = Omit<Title_Data_Page["title"], "seasons"> & {
  slug: string;
  seasons: Ume_Seasons;
  cast: Promise<(MoviesGetCreditsCast | TVGetCreditsCast)[]> | null;
  genres: Promise<(MoviesGetDetailsGenre | TVGetDetailsGenre)[]> | null;
  related: Title_Search[] | null;
  id: number;
};

export interface SeekEpisode {
  season_number: number;
  episode_index: number;
  data: Episode;
}
