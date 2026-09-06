export function storagePathsFromUrls(urls: string[]): string[] {
  return urls
    .map((url) => url.split("/listing-images/")[1])
    .filter((path): path is string => Boolean(path));
}
