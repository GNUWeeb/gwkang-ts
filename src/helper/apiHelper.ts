import { CommandContext, Context } from 'grammy';
import { stickerpackStateModel } from '../models/stickerpackState';
import fs from 'fs';
import * as FormData from 'form-data'
import axios from 'axios';

export class apiHelper {
  /**
   * 
   * @param ctx ctx
   * @param stickerPackName stickername
   * @returns true if found
   */
  public static async checkStickerPack(ctx: CommandContext<Context>, stickerPackName: string): Promise<boolean> {
    try {

      await ctx.api.getStickerSet(stickerPackName);

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

  public static async checkStickerPackDB(ctx: CommandContext<Context>, stickerPackName: string):
    Promise<boolean> {
    const StickerpackStateDoc = await stickerpackStateModel.findOne({
      user_id: ctx.message?.from.id!,
    });

    for (let i = 0; i < StickerpackStateDoc?.stickersetname.length!; i++) {
      if (stickerPackName == StickerpackStateDoc?.stickersetname[i]) {

        // found
        return true;
      }
    }
    return false;
  }

  public static async countCurrentPack(ctx: CommandContext<Context>, stickerPackName: string): Promise<number> {

    return (await ctx.api.getStickerSet(stickerPackName)).stickers.length;
  }
}