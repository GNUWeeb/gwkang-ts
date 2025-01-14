import { createCommand } from '../utils/command';
import { CommandContext, Context } from 'grammy';
import { BotHelpers, IStickerpackDataReversed } from '../helper/strings';
import { stickerpackStateModel } from '../models/stickerpackState';
import { ReplyParameters, Sticker, InputSticker } from 'grammy/types';
import { IStickerpackData } from '../helper/strings';
import GraphemeSplitter from 'grapheme-splitter';
var split = require('emoji-aware').split;

class forkUtils {
    public static async findHighestUnusedIdx(ctx: CommandContext<Context>) {

        const StickerpackStateDoc = await stickerpackStateModel.findOne({
            user_id: ctx.message?.from.id!,
        });

        let highest = 1;

        if (StickerpackStateDoc?.stickersetname!.length != 0) {
            for (let i = 0; i < StickerpackStateDoc?.stickersetname?.length!; i++) {
                let reversedData: IStickerpackDataReversed = BotHelpers.reverseStickerpackName(StickerpackStateDoc?.stickersetname[i]!);

                if (reversedData.index > highest) {
                    highest = reversedData.index
                }
            }
        }

        if (highest == 1) {
            return highest
        } else {
            return highest + 1;
        }

    }

    private static async appendNewStickerSetToUID(user_id: number, newStickersetName: string) {
        let old = await stickerpackStateModel.findOne({
            user_id: user_id
        });

        let newAppendSticker: string[] = old?.stickersetname!;
        newAppendSticker.push(newStickersetName!);

        await stickerpackStateModel.updateOne(
            {
                user_id: user_id
            },
            {
                stickersetname: newAppendSticker
            }
        )
    }

    public static async modelCreateRecordAndStickerpack(ctx: CommandContext<Context>): Promise<IStickerpackData> {
        let highestIdxUnused: number = await forkUtils.findHighestUnusedIdx(ctx);

        let newlyGeneratedData: IStickerpackData = await BotHelpers.genStickerpackName(
            ctx,
            highestIdxUnused
        );

        await forkUtils.appendNewStickerSetToUID(
            ctx.message?.from.id!,
            newlyGeneratedData.stickerName
        )

        newlyGeneratedData.sticker_idx = highestIdxUnused;

        return newlyGeneratedData
    }
}



/**
 * get all sticker, loop for each sticker
 * then, append it to new stickerpacks
 */

const forkFromStickers = async (ctx: CommandContext<Context>) => {
    let stickerNew: IStickerpackData = await forkUtils.modelCreateRecordAndStickerpack(ctx);
    const stickers = await ctx.api.getStickerSet(ctx.message?.reply_to_message?.sticker?.set_name!)

    let stickerInputTransformed: InputSticker[] = stickers.stickers.map((val: Sticker) => {
        let input: InputSticker = {
            sticker: val.file_id!,
            emoji_list: split(val.emoji!),
            format: 'static',
        };

        return input;
    })

    await ctx.api.createNewStickerSet(
        ctx.message?.from.id!,
        stickerNew.stickerName,
        stickerNew.stickerTitle!,
        stickerInputTransformed
    );

    await ctx.reply(
        `Forked, <a href="https://t.me/addstickers/${stickerNew.stickerName}">#pack_${stickerNew.sticker_idx}</a>`,
        { parse_mode: 'HTML' }
    );

}

const forksCommand = createCommand(
    {
        name: 'fork',
        description: 'Copy all another user sticker for yourself',
    },
    async ctx => {
        /* setup reply id */
        let replyparam: ReplyParameters = {
            message_id: ctx.message?.message_id!,
        };

        if (
            ctx.message?.reply_to_message?.sticker! != undefined &&
            ctx.message?.reply_to_message?.photo == undefined
        ) {
            await forkFromStickers(ctx);
        } else {
            await ctx.reply("please reply a sticker", {
                reply_parameters: replyparam
            })
        }
    }
);

export default forksCommand;
