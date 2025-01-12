import { CommandContext, Context } from 'grammy';
import { ReplyParameters } from 'grammy/types';

const invalidInput = async (ctx: CommandContext<Context>) => {
  /* setup reply id */
  let replyparam: ReplyParameters = {
    message_id: ctx.message?.message_id!,
  };

  await ctx.reply(
    'the input is invalid, you need to reply to a sticker. \n\n' + 
    '- /kang: (will use default packs, fast and easy)\n' + 
    '- /kang <pack_id>: kang to spesific sticker ID\n' + 
    '- /kang <emoji>: kang to default sticker with spesific emoji\n' + 
    '- /kang <packid> <emoji>: kang to spesific sticker ID and gives them emoji', {
    reply_parameters: replyparam,
  });
};

const kangStickerRequestedNotFound = async (ctx: CommandContext<Context>) => {
  /* setup reply id */
  let replyparam: ReplyParameters = {
    message_id: ctx.message?.message_id!,
  };

  await ctx.reply('requested sticker not found, check your available pack using /mypack or make one using /newpack', {
    reply_parameters: replyparam,
  });
};

export { invalidInput, kangStickerRequestedNotFound };
