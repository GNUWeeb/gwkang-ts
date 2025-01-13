import { createCommand } from '../utils/command';
import { CommandContext, Context } from 'grammy';
import { BotHelpers, IStickerpackDataReversed } from '../helper/strings';
import { stickerpackStateModel } from '../models/stickerpackState';


const showAvailablePacks = async (ctx: CommandContext<Context>): Promise<void> => {

    let replyparam: ReplyParameters = {
        message_id: ctx.message?.message_id!,
    };

    let data = await stickerpackStateModel.findOne({
        user_id: ctx.message?.from.id
    })


    if (data?.stickersetname.length == 0) {
        await ctx.reply(
            "No packs available", {
            reply_parameters: replyparam,
            parse_mode: 'HTML',
        }
        );
    } else {
        let rawString: string = "packs available\n\n";
        data?.stickersetname.map((cmd) => {
            let reversedData: IStickerpackDataReversed = BotHelpers.reverseStickerpackName(cmd)
                                                        ;

            rawString = rawString + `<a href="https://t.me/addstickers/${cmd}">#pack_${reversedData.index}</a>`
            rawString = rawString + '\n'
        })

        await ctx.reply(
            rawString, {
            reply_parameters: replyparam,
            parse_mode: 'HTML',
        }
        );

    }


};

const mypacksCommand = createCommand(
    {
        name: 'mypack',
        description: 'Show my all kanged packs',
    },
    async ctx => {
        await showAvailablePacks(ctx);
    }
);

export default mypacksCommand;
