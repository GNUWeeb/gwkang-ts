export class StickerTooMuchSynteticTrue extends Error {
        constructor() {
                super();

                if (Error.captureStackTrace) {
                        Error.captureStackTrace(this, StickerTooMuchSynteticTrue);
                }

                this.name = "requested pack is too much sticker"
                this.message = "sorry, requested pack is too much sticker. try with another pack or write /mypack to see stickerpack lists";

        }
}

