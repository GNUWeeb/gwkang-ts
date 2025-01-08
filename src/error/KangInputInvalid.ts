export class KangInputInvalid extends Error {
  constructor() {
    super();

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, KangInputInvalid);
    }

    this.name = "Input Invalid"
    this.message = "the input is not either number or emoji, use /kang <pack_id> <optional_emoji>";
  }
}