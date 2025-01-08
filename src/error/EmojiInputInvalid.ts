export class EmojiInputInvalid extends Error {
  constructor() {
    super();

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EmojiInputInvalid);
    }

    this.name = "Emoji input invalid"
    this.message = "emoji is invalid, or contain ASCII text";
  }
}