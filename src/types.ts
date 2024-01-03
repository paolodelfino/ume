import { MoviesGetCreditsCast, TVGetCreditsCast } from "tmdb-js-node";

export interface Title_Image {
  // imageable_type: "title" | "episode";
  filename: string;
  type: "cover_mobile" | "poster" | "background" | "logo" | "cover";
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
  name: "top10" | "trending" | "latest" | "upcoming" | "genre" | "new_episodes";
  title_type?: "movie" | "tv" | null;
  genre?: Title_Genre["name"] | null;
  // offset?: number | null;
}

export interface Title_Slider {
  name: string;
  label: string;
  titles: (Title_Search & {
    upcoming_seasons: {
      number: number;
      release_date: string;
    }[];
  })[];
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
      number: number;
      episodes_count: number;
    }[];
    trailers: {
      key: string;
      name: string;
    }[];
    images: Title_Image[];
    genres: Title_Genre[];
    scws_id: number;
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
  scws_id: number | null;
}

export type Movie_Collection = {
  name: string;
  poster_path: string;
}[];

export type Title_Details = Omit<
  Title_Data_Page["title"],
  "trailers" | "seasons_count"
> & {
  videos: Title_Data_Page["title"]["trailers"];
  slug: string;
  cast?: (MoviesGetCreditsCast | TVGetCreditsCast)[];
  related?: Title_Search[];
  id: number;
  collection?: Movie_Collection;
  scws_id: number | null;
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

export type Title_Mylist = {
  id: number;
  slug: string;
};

export type Title_Continue_Watching = {
  id: number;
  slug: string;
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

export interface Person_Search {
  id: number;
  name: string;
  profile_path: string;
}

export interface Person_Details {
  id: number;
  name: string;
  profile_path: string;
  known_for_movies: {
    name: string;
    poster_path: string;
    popularity: number;
  }[];
  known_for_department: string;
}
