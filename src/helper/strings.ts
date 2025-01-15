import { CommandContext, Context } from 'grammy';
import * as emoji from 'node-emoji'
import GraphemeSplitter from 'grapheme-splitter';
import containsEmoji from 'contains-emoji';
import path from 'path';

export interface IStickerpackData {
  stickerTitle: string | null;
  stickerName: string;
  emoji: string[];

  sticker_idx: number;

  /**
   * this prop represent sticker is custom requested or not
   * just like /kang or /kang 4
   */
  synthetic_req_stickerpack: boolean;
}

export interface IStickerpackDataReversed {
  index: number;
  user_id: number;
  by_bot: string;
}

export interface IEmojiSanitizeResult {
  msg: string;
  code: number;
  splitted: string[];
}

export class BotHelpers extends String {
  private static unix(): number {
    return Date.now();
  }

  /**
   * Returns formatted sticker title and sticker name.
   *
   * @param ctx - a context from caller
   * @returns promise of IStickerpackData, which contained sticker title and sticker name respectively
   *
   * @beta
   * 
   * convention: a_{index}_{user_id}_by_{botname}{
   * example: a_1_5892885430_by_nekonakobot
   * 
   * so we can use index in order to refer corresponding sticker}
   */
  public static async genStickerpackName(
    ctx: CommandContext<Context>, stickerIndex: number
  ): Promise<IStickerpackData> {

    let myUsername = await ctx.api.getMe();

    let data: IStickerpackData = {} as IStickerpackData;

    if (ctx.message?.sender_chat != undefined) {
      data.stickerTitle = `Sticker #${stickerIndex} ${ctx.message.sender_chat.title}`;
      data.stickerName = `a_${stickerIndex}_${ctx.message.sender_chat.id}_by_${myUsername.username}`;

      return data;
    }

    /* 
    handle user doesn't have a last name
    */

    if (ctx.message?.from.last_name === undefined) {
      data.stickerTitle = `Sticker #${stickerIndex} ${ctx.message?.from.first_name}`;
    } else {
      data.stickerTitle = `Sticker #${stickerIndex} ${ctx.message?.from.first_name} ${ctx.message?.from.last_name}`;
    }
    data.stickerName = `a_${stickerIndex}_${ctx.message?.from.id}_by_${myUsername.username}`;

    return data;
  }


  /**
   * turn back 'a_1_5892885430_by_nekonakobot'
   */
  public static reverseStickerpackName(
    stickername: string
  ): IStickerpackDataReversed {

    let data: string[] = stickername.split('_');
    let ret: IStickerpackDataReversed = {} as IStickerpackDataReversed;

    ret.index = parseInt(data[1]);
    ret.user_id = parseInt(data[2]);
    ret.by_bot = data[4];

    return ret;
  }

  public static genRandomFileName(str: string): string {
    let ext: string = path.extname(str);
    let random: string = (Math.random() + 1).toString(36).substring(7);

    return `${random}${ext}`;
  }

  /**
   * 
   * @param str input string
   * return -1 of string is invalid
   */
  public static async validateEmojiString(str: string): Promise<IEmojiSanitizeResult> {
    let splitter: GraphemeSplitter = new GraphemeSplitter();

    let data: string[] = splitter.splitGraphemes(str);

    let result: IEmojiSanitizeResult = {} as IEmojiSanitizeResult;

    result.code = 0;
    result.splitted = data;

    if (data)
      for (let i = 0; i < data.length; i++) {
        if (!containsEmoji(data[i])) {
          result.msg = "the sticker emoji is must be emoji, not a text";
          result.code = -1;
        }
      }
    return result;
  }

  public static isInt(value: string): boolean {
    return !isNaN(Number(value)) && value.trim() !== '';
  }

  public static getValueFromCommands(str: string): string | null {
    let split: any = str.split(" ")

    let rawArr: string[] = []
    split.forEach((cmd: string, i: number) => {
      if (i != 0) {
        rawArr.push(cmd)
      }
    })

    if (rawArr.length == 0) {
      return null;
    } else {
      return rawArr.join(' ')
    }
  }

  public static normalizeName(ctx: CommandContext<Context>): string {
    if (ctx.message?.reply_to_message?.from?.last_name == undefined) {
      return ctx.message?.reply_to_message?.from?.first_name!;
    }else {
      return `${ctx.message?.reply_to_message?.from?.first_name} ${ctx.message?.reply_to_message?.from?.last_name}`
    }
  }
}
