import { createCommand } from '../utils/command';
import { getCommands } from '../utils/command';
import { CommandMetadata } from '../core';
import { ReplyParameters } from 'grammy/types';
import { InlineKeyboard } from 'grammy';


const packinfo = createCommand(
  {
    name: 'packinfo',
    description: 'Show information about stickerpack pack',
  },
  async ctx => {
    let replyparam: ReplyParameters = {
      message_id: ctx.message?.message_id!,
    };

    const sticker = ctx.message?.reply_to_message?.sticker;
    if (!sticker) {
      await ctx.reply('Please reply to a sticker!', {
        reply_parameters: replyparam,
      });
      return;
    }

    const data = await ctx.api.getStickerSet(sticker.set_name!);
    const replyText = `<b>${data.title}</b>\n\n` +
      `count: ${data.stickers.length}\n` +
      `set  : ${sticker.set_name}`;

    await ctx.reply(replyText, {
      reply_parameters: replyparam,
      parse_mode: "HTML"

    });

  }
);

export default packinfo;
