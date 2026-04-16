import { classNames } from '~/utils/classNames';

export function cn(...classList: Array<string | false | null | undefined | Record<string, boolean>>) {
  return classNames(
    ...classList.filter((value): value is string | Record<string, boolean> =>
      typeof value === 'string' || (typeof value === 'object' && value !== null),
    ),
  );
}
