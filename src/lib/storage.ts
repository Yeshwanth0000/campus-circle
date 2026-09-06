export function storagePathsFromUrls(urls: string[]): string[] {
  return urls
    .map((url) => url.split("/listing-images/")[1])
    // The stored URL has the path percent-encoded (spaces, parens, etc. from
    // the original filename) — the storage object's real name doesn't, so an
    // undecoded path silently matches nothing and .remove() is a no-op.
    .map((path) => (path ? decodeURIComponent(path) : path))
    .filter((path): path is string => Boolean(path));
}
