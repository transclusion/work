import { Config } from "../types";

export interface Opts {
  config: Config;
  envConfig: {
    [key: string]: string;
  };
  cwd: string;
  pkg: {
    alias?: {
      [key: string]: string;
    };
  };
  minify?: boolean;
  plugins: Config[];
}
