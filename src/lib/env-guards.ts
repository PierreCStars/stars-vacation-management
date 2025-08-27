export const isCI = !!process.env.CI;
export const isProd = process.env.NODE_ENV === "production";
export const isDev = process.env.NODE_ENV === "development";
export const allowDangerousSideEffects =
  process.env.ALLOW_SIDE_EFFECTS === "true" && !isCI; // never in CI/build
