export type Result<T> =
  | {
      success: true;
      content: T;
    }
  | {
      success: false;
      error: string;
    };
