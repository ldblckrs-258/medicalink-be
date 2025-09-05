/**
 * This type is used to make all properties of an object optional
 */
export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};
