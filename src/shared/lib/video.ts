/** Recognises YouTube/Vimeo links that must be shown in an iframe player. */
export const isEmbeddableVideo = (url: string) => /youtu\.be|youtube\.com|vimeo\.com/i.test(url);

export function toEmbedUrl(url: string): string {
  const youtube = url.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{6,})/);
  if (youtube) return `https://www.youtube.com/embed/${youtube[1]}`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return url;
}
