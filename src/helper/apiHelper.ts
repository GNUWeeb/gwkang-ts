import { CommandContext, Context } from 'grammy';

export class apiHelper {
  /**
   * 
   * @param ctx ctx
   * @param stickerPackName stickername
   * @returns true if found
   */
  public static async checkStickerPack(ctx: CommandContext<Context>, stickerPackName: string): Promise<boolean> {
    try {

      const stickerSet = await ctx.api.getStickerSet(stickerPackName);
      console.log("Sticker pack found:", stickerSet);
      return true
    } catch (error: any) {
      if (error.description && error.description.includes("STICKERSET_INVALID")) {
        return false
      } else {
        console.error("An error occurred:", error);
        
      }
      return false
    }
  }
}