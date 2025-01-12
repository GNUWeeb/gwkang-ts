import { createCommand } from '../utils/command';
import { getCommands } from '../utils/command';
import { CommandMetadata } from '../core';
import { ReplyParameters } from 'grammy/types';
import { InlineKeyboard } from 'grammy';

const help = createCommand(
  {
    name: 'help',
    description: 'show all command',
  },
  async ctx => {
    let replyparam: ReplyParameters = {
      message_id: ctx.message?.message_id!,
    };

    let data: CommandMetadata[] = Array.from(getCommands().values());

    let rawString: string = "Command available\n\n";
    data.map((cmd) => {
      rawString = rawString + `/${cmd.name}: ${cmd.description}`

      if (cmd.alias != undefined) {
        if (cmd.alias.length != 0) {
          rawString = rawString + ', alias '
  
          cmd.alias.map((aliascmd, i) => {
            
            if (cmd.alias != undefined) {
              if (cmd.alias.length == i + 1) {
                rawString = rawString + `/${aliascmd}`
              } else {
                rawString = rawString + `/${aliascmd}, `
              }
            }
            
          })
        }
      }
      

      rawString = rawString + '\n'
    })

    rawString = rawString + "\nAny questions❓, please let us know."

    let keyboardData: InlineKeyboard = new InlineKeyboard()
      .url("support group", "https://t.me/GNUWeeb")
      

    await ctx.reply(rawString, {
      reply_parameters: replyparam,
      reply_markup: keyboardData
    });



  }
);

export default help;
