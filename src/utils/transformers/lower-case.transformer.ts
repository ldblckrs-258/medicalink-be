import { TransformFnParams } from 'class-transformer/types/interfaces';
import { MaybeType } from '../types/maybe.type';

export const lowerCaseTransformer = (
  params: TransformFnParams,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
): MaybeType<string> => params.value?.toLowerCase().trim() as string;
