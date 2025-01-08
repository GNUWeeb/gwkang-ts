import { createCommand } from '../utils/command';
import { invalidInput, kangStickerRequestedNotFound } from '../helper/errors';
import { stickerpackStateModel } from '../models/stickerpackState';
import { stickerpackHistoryModel } from '../models/stickerpackHistory';
import { CommandContext, Context } from 'grammy';
import { InputFile, InputSticker, Message } from 'grammy/types';
import { BotHelpers, IStickerpackData, IEmojiSanitizeResult } from '../helper/strings';
import { apiHelper } from '../helper/apiHelper';
import { downloadFileToTemp } from '../helper/io';
import sharp from 'sharp';
import { ReplyParameters } from 'grammy/types';
import { StickerRequestedNotFound } from '../error/stickerRequestedNotFound';
import { EmojiInputInvalid } from '../error/EmojiInputInvalid';
import { IndexPackInvalid } from '../error/IndexPackInvalid';
import { KangInputInvalid } from '../error/KangInputInvalid';

const createNewStickerpack = async (
  ctx: CommandContext<Context>,
  stickerFileId: string,
  stickerdata: IStickerpackData
): Promise<boolean> => {
  // let stickerData: IStickerpackData = await BotHelpers.genRandomStickerpackName(ctx);

  let input: InputSticker[] = [
    {
      sticker: stickerFileId!,
      emoji_list: stickerdata.emoji, // test
      format: 'static',
    },
  ];

  /* return true on success */
  let ret: boolean = await ctx.api.createNewStickerSet(
    ctx.message?.from.id!,
    stickerdata.stickerName,
    stickerdata.stickerTitle!,
    input
  );

  return ret
};

const addStickerPack = async (
  ctx: CommandContext<Context>,
  prevStickerData: IStickerpackData,
  stickerFileId: string
): Promise<boolean> => {
  let input: InputSticker = {
    sticker: stickerFileId!,
    emoji_list: prevStickerData.emoji,
    format: 'static',
  };

  let ret: boolean = await ctx.api.addStickerToSet(ctx.message?.from.id!,
    prevStickerData.stickerName,
    input);

  return ret;
};

const kangFromSticker = async (ctx: CommandContext<Context>, prevStickerData: IStickerpackData): Promise<void> => {
  /* setup reply id */
  let replyparam: ReplyParameters = {
    message_id: ctx.message?.message_id!,
  };

  /* 
      find current used sticker
    */

  const StickerpackStateDoc = await stickerpackStateModel.findOne({
    user_id: ctx.message?.from.id!,
  });

  if (StickerpackStateDoc == undefined) {
    let ret: boolean = await createNewStickerpack(
      ctx,
      ctx.message?.reply_to_message?.sticker?.file_id!,
      prevStickerData
    );

    if (ret != false) {
      await ctx.reply(
        `Sticker pack created and <a href='https://t.me/addstickers/${prevStickerData.stickerName}'>Kanged!</a>`,
        {
          parse_mode: 'HTML',
          reply_parameters: replyparam,
        }
      );

      /* done with sticker, now insert previous created sticker to the db as new data */
      let doc = new stickerpackStateModel({
        user_id: ctx.message?.from.id!,
        current: prevStickerData.stickerName,
      });

      await doc.save();
    } else {
      await ctx.reply('kang failed', {
        reply_parameters: replyparam,
      });
    }
  } else {
    /* previous data is found */

    let ret: boolean = await addStickerPack(
      ctx,
      prevStickerData,
      ctx.message?.reply_to_message?.sticker?.file_id!
    );

    if (!ret) {
      await ctx.reply('kang failed', {
        reply_parameters: replyparam,
      });
    } else {
      await ctx.reply(
        `New sticker <a href='https://t.me/addstickers/${prevStickerData.stickerName}'>Kanged!</a>`,
        {
          reply_parameters: replyparam,
          parse_mode: 'HTML',
        }
      );
    }
  }
};

/**
 * return image path of resized image
 *
 * @param fileName
 */
const processImage = async (fileName: string): Promise<string> => {
  const imgctx = await sharp(fileName).metadata();

  let width: number = imgctx.width!;
  let height: number = imgctx.height!;

  let new_width = 0;
  let new_height = 0;

  if (width > height) {
    new_width = 512;
    new_height = Math.floor((512 / width) * height);
  } else {
    new_height = 512;
    new_width = Math.floor((512 / height) * width);
  }

  let outImage: string = `/tmp/${BotHelpers.genRandomFileName(fileName)}`;

  await sharp(fileName).resize(new_width, new_height).toFile(outImage);

  return outImage;
};

const kangFromImage = async (ctx: CommandContext<Context>, prevStickerData: IStickerpackData): Promise<void> => {
  /* setup reply id */
  let replyparam: ReplyParameters = {
    message_id: ctx.message?.message_id!,
  };

  /* send sticker first */

  const largestphoto = await ctx.message?.reply_to_message?.photo?.pop();
  const file = await ctx.api.getFile(largestphoto?.file_id!);

  let tempData = await downloadFileToTemp(
    `https://api.telegram.org/file/bot${ctx.api.token}/${file.file_path}`,
    BotHelpers.genRandomFileName(file.file_path!)
  );

  let resizedImage = await processImage(tempData);

  let sentSticker: Message = await ctx.api.sendSticker(
    ctx.message?.chat.id!,
    new InputFile(resizedImage)
  );

  const StickerpackStateDoc = await stickerpackStateModel.findOne({
    user_id: ctx.message?.from.id!,
  });

  if (StickerpackStateDoc == undefined) {
    let ret: boolean = await createNewStickerpack(
      ctx,
      sentSticker.sticker?.file_id!,
      prevStickerData
    );

    if (ret != false) {
      await ctx.reply(
        `Sticker pack created and <a href='https://t.me/addstickers/${prevStickerData.stickerName}'>Kanged!</a>`,
        {
          parse_mode: 'HTML',
          reply_parameters: replyparam,
        }
      );

      /* done with sticker, now insert previous created sticker to the db */
      let doc = new stickerpackStateModel({
        user_id: ctx.message?.from.id!,
        current: prevStickerData.stickerName,
      });

      await doc.save();
    } else {
      await ctx.reply('kang failed', {
        reply_parameters: replyparam,
      });
    }
  } else {
    /* previous data is found */

    let ret: boolean = await addStickerPack(
      ctx,
      prevStickerData,
      sentSticker.sticker?.file_id!
    );
    if (!ret) {
      await ctx.reply('kang failed');
    } else {
      await ctx.reply(
        `New sticker <a href='https://t.me/addstickers/${prevStickerData.stickerName}'>Kanged!</a>`,
        {
          parse_mode: 'HTML',
          reply_parameters: replyparam,
        }
      );
    }
  }
};

/**
 * 
 * @param ctx ctx
 * @param input string of value
 * 
 * if input is undefined or null, return current active sticker pack from stickerpackstate 
 * if input is a number, return selected pack (if available, throw error if not found)
 * if input is undefined or null, and user didn't have any pack, generate new name. based on convention
 * 
 * this func only calculate string, do not any insert here
 */
const parseInput = async (ctx: CommandContext<Context>): Promise<IStickerpackData> => {

  let data: IStickerpackData = {} as IStickerpackData;
  let splitted: string[] = ctx.message?.text.split(' ')!;
  let commandValue = BotHelpers.getValueFromCommands(ctx.message?.text!)

  /* do not touch */
  let stickerPackIdx: number = 1; // default value, 0 when unspesified



  /* handle emoji in args 2 */
  if (splitted.length == 3) {
    /* index 
 
    1: pack number
    2: emoji
    */

    let result: IEmojiSanitizeResult = await BotHelpers.validateEmojiString(splitted[2]);
    if (result.code == -1) {
      throw new EmojiInputInvalid();

      /* sticker generation failed, due invalid emojis */
    } else {
      data.emoji = result.splitted

      /* handle error when /pack abc ❤️ */
      if (BotHelpers.isInt(splitted[1])) {
        stickerPackIdx = parseInt(splitted[1]);
      } else {
        throw new IndexPackInvalid();
      }

    }
  } else if (splitted.length == 2) {
    /* index 
 
    1: can be pack number or emoji
    */
    /* if emoji, use default pack, and split the emoji */
    let testEmoji: IEmojiSanitizeResult = await BotHelpers.validateEmojiString(splitted[1]);
    console.log(testEmoji.code)
    if (testEmoji.code == -1) {
      /* do not throw an exception, probably arg 1 is a pack number */
      if (BotHelpers.isInt(splitted[1])) {
        stickerPackIdx = parseInt(splitted[1]);

        /* use default emoji */
        data.emoji = ['😁']
      } else {
        // throw invalid here, because the first arg is not an emoji, also not a integer
        throw new KangInputInvalid()
      }
    } else {

      if (BotHelpers.isInt(splitted[1])) {
        stickerPackIdx = parseInt(splitted[1]);

        /* use default emoji */
        data.emoji = ['😁']
      } else {
        // console.log("taken")
        data.emoji = testEmoji.splitted
      }

      /* stickerPackIdx is unchanged */
    }
  } else if (splitted.length == 1) {
    data.emoji = ['😁']
  } else {
    // handle unexpected args here (future)
  }

  /* search for the data */
  const StickerpackStateDoc = await stickerpackStateModel.findOne({
    user_id: ctx.message?.from.id!,
  });

  if (StickerpackStateDoc === null) {
    /* 
    * data not found, generate new, sticker title is essential for generation 
    * do not care about index, new sticker always start from 1
    */
    let newlyGeneratedData: IStickerpackData = await BotHelpers.genStickerpackName(ctx, 1);
    /* re-pack */

    data.stickerName = newlyGeneratedData.stickerName
    data.stickerTitle = newlyGeneratedData.stickerTitle

    return data
  } else {
    if (commandValue == null) {
      /* no info or emoji provided, use default emoji and sticker */

      /* in this section, sticker title might unused, because telegram already hold it 
       * sticker title only used in generation process
      */

      // let data: IStickerpackData = {
      //     stickerTitle: null,
      //     stickerName: StickerpackStateDoc?.current!,
      //     emoji: ['😁']
      // }
      // console.log("commandvalue == null taken")
      data.stickerTitle = null;
      data.stickerName = StickerpackStateDoc?.current!
      data.emoji = ['😁']

      return data
    } else {

      /* already parsed in first function */

      let predicted: IStickerpackData = await BotHelpers.genStickerpackName(ctx, stickerPackIdx);
      // console.log("index: " + stickerPackIdx)

      /* find it, return true if found */
      let isFound: boolean = await apiHelper.checkStickerPack(ctx, predicted.stickerName);
      if (isFound) {

        /* in this section, sticker title maybe unused, because telegram already hold it 
        * sticker title only used in generation process
        */

        // let data: IStickerpackData = {
        //     stickerTitle: null,
        //     stickerName: predicted.stickerName!,
        // }
        data.stickerTitle = null;
        data.stickerName = predicted.stickerName;
        /* no emoji, already filled */

        return data;
      } else {
        throw new StickerRequestedNotFound();
      }

    }
  }
}

const kangCommand = createCommand(
  {
    name: 'kang',
    alias: [],
    description: 'Kanging other user sticker',
  },
  async ctx => {
    if (ctx.message?.reply_to_message == undefined) {
      await invalidInput(ctx);
    } else {

      /* setup reply id */
      let replyparam: ReplyParameters = {
        message_id: ctx.message?.message_id!,
      };
      // console.log("aa")

      try {
        let stickerDataPredicted: IStickerpackData = await parseInput(ctx);

        // console.log(stickerDataPredicted)

        if (
          ctx.message?.reply_to_message?.sticker! != undefined &&
          ctx.message?.reply_to_message?.photo == undefined
        ) {
          await kangFromSticker(ctx, stickerDataPredicted);
        } else if (
          ctx.message?.reply_to_message?.photo != undefined &&
          ctx.message?.reply_to_message?.sticker == undefined
        ) {
          await kangFromImage(ctx, stickerDataPredicted);
        } else {
          await invalidInput(ctx);
        }
      } catch (err: any) {
        await ctx.reply(err.message, {
          reply_parameters: replyparam
        })
      }

    }
  }
);

export default kangCommand;
