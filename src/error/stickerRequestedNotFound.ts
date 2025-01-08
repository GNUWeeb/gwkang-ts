export class StickerRequestedNotFound extends Error {
  constructor() {
    super();

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, StickerRequestedNotFound);
    }

    this.name = "sticker not found (resolved serverside by telegram)"
    this.message = "Pack not found, Make sure your pack id is found\n\ntry check your own sticker by write /mypack or make new one using /newpack";

  }
}

