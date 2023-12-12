import { MoviesGetCreditsCast, TVGetCreditsCast } from "tmdb-js-node";
import { Ume_Seasons } from "./ume_seasons";

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

export interface Slider_Fetch {
  name: "top10" | "trending" | "latest" | "upcoming" | "genre";
  title_type?: "movie" | "tv" | null;
  genre?: Title_Genre["name"] | null;
}

export interface Title_Slider {
  name: string;
  label: string;
  titles: Title_Search[];
}

type Title_Genre = {
  name:
    | "Crime"
    | "Commedia"
    | "War & Politics"
    | "Action & Adventure"
    | "Mistero"
    | "Sci-Fi & Fantasy"
    | "Musica"
    | "televisione film"
    | "Korean drama"
    | "Kids"
    | "Azione"
    | "Avventura"
    | "Soap"
    | "Fantascienza"
    | "Reality"
    | "Storia"
    | "Animazione"
    | "Dramma"
    | "Guerra"
    | "Fantasy"
    | "Western"
    | "Documentario"
    | "Commedia"
    | "Famiglia"
    | "Thriller"
    | "Romance"
    | "Horror";
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
    genres: Title_Genre[];
  };
  sliders: Title_Slider[];
}

export interface Episode {
  id: number;
  number: number;
  name: string;
  plot: string;
  duration: number;
  images: Title_Image[];
}

export type Movie_Collection = {
  name: string;
  poster_path: string;
}[];

export type Title_Details = Omit<Title_Data_Page["title"], "seasons"> & {
  slug: string;
  seasons: Ume_Seasons;
  cast: Promise<(MoviesGetCreditsCast | TVGetCreditsCast)[]> | null;
  related: Title_Search[] | null;
  id: number;
  collection: (() => Promise<Movie_Collection | null>) | null;
};

export interface Seek_Episode {
  season_number: number;
  episode_index: number;
  data: Episode;
}

export interface Dl_Res {
  url: string;
  kind: "video" | "subtitle";
  rendition: string;
}

export interface Title_Entry {
  id: number;
  slug: string;
}

export type Title_Mylist = Title_Entry;

export type Title_Continue_Watching = Title_Mylist & {
  time: number;
  season_number?: number;
  episode_number?: number;
};

export interface Title_Preview {
  id: number;
  type: "movie" | "tv";
  runtime: number | null;
  release_date: string;
  plot: string;
  seasons_count: number;
  images: Title_Image[];
  genres: Title_Genre[];
}
