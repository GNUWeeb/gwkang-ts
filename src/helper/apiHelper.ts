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

  public static async countCurrentPack(ctx: CommandContext<Context>, stickerPackName: string): Promise<number> {
    
    return (await ctx.api.getStickerSet(stickerPackName)).stickers.length;
  }
}