type PropertyDecoratorFactory = (options?: object) => PropertyDecorator;
const noop: PropertyDecoratorFactory = () => () => undefined;

export const ApiProperty = noop;
export const ApiPropertyOptional = noop;
