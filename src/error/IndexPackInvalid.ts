export class IndexPackInvalid extends Error {
  constructor() {
    super();

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, IndexPackInvalid);
    }

    this.name = "pack index invalid"
    this.message = "The pack index is invalid, index must be a number.";

  }
}