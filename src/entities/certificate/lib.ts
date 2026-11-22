/** Human-friendly certificate number, stable for a user/course pair. */
export function certificateNumber(userId: string, courseId: string): string {
  const tail = (value: string) =>
    value
      .replace(/[^a-z0-9]/gi, '')
      .slice(-4)
      .toUpperCase();
  return `SP-${tail(userId)}-${tail(courseId)}`;
}
