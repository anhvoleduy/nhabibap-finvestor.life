export const Type =
  (_typeFunction?: () => unknown): PropertyDecorator =>
  () =>
    undefined;
export const Exclude = (): PropertyDecorator => () => undefined;
export const Expose = (): PropertyDecorator => () => undefined;
