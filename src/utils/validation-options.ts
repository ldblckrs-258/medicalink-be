import {
  HttpStatus,
  UnprocessableEntityException,
  ValidationError,
  ValidationPipeOptions,
} from '@nestjs/common';

function generateErrors(errors: ValidationError[]) {
  return errors.reduce<Record<string, string>>(
    (
      accumulator: Record<string, string>,
      currentValue: ValidationError,
    ): Record<string, string> => {
      const property: string = currentValue.property;
      if ((currentValue.children?.length ?? 0) > 0) {
        return {
          ...accumulator,
          [property]: JSON.stringify(
            generateErrors(currentValue.children ?? []),
          ),
        };
      }
      const constraints: Record<string, string> | undefined =
        currentValue.constraints;
      return {
        ...accumulator,
        [property]: constraints ? Object.values(constraints).join(', ') : '',
      };
    },
    {},
  );
}

const validationOptions: ValidationPipeOptions = {
  transform: true,
  whitelist: true,
  errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
  exceptionFactory: (errors: ValidationError[]) => {
    return new UnprocessableEntityException({
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      errors: generateErrors(errors),
    });
  },
};

export default validationOptions;
