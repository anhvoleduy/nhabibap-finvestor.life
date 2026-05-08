const noop = (): PropertyDecorator => () => undefined;
const noopWith1 =
  (_arg: unknown): PropertyDecorator =>
  () =>
    undefined;

export const IsString = noop;
export const IsNumber = noop;
export const IsOptional = noop;
export const IsDateString = noop;
export const IsEmail = noop;
export const IsArray = noop;
export const IsBoolean = noop;
export const IsNotEmpty = noop;
export const IsPositive = noop;
export const IsInt = noop;
export const IsUUID = noop;
export const Min = noopWith1;
export const Max = noopWith1;
export const MinLength = noopWith1;
export const MaxLength = noopWith1;
export const IsIn = noopWith1;
export const ValidateNested = noopWith1;
export const IsObject = noop;
