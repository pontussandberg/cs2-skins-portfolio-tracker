export class CsfloatAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CsfloatAuthError";
  }
}

export class CsfloatHttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "CsfloatHttpError";
  }
}
