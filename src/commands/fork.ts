import { createCommand } from '../utils/command';
import { CommandContext, Context } from 'grammy';
import { BotHelpers, IStickerpackDataReversed } from '../helper/strings';
import { stickerpackStateModel } from '../models/stickerpackState';
import { ReplyParameters, StickerSet, InputSticker, Sticker } from 'grammy/types';
import { IStickerpackData } from '../helper/strings';
import GraphemeSplitter from 'grapheme-splitter';
var split = require('emoji-aware').split;

class forkUtils {
    private static async modelCreateRecordFirstTime(data: IStickerpackData, ctx: CommandContext<Context>) {
        let stickersetArr: string[] = [] as string[];

        // stickersetArr.push(data.stickerName);

        let db = new stickerpackStateModel({
            user_id: ctx.message?.from.id!,
            stickersetname: stickersetArr
        })

        await db.save();
    }
    
    private static async generateStickerPackDataFirstTime(ctx: CommandContext<Context>) {
        let data :IStickerpackData = {} as IStickerpackData;

        let newlyGeneratedData: IStickerpackData = await BotHelpers.genStickerpackName(ctx, 1);

        data.stickerName = newlyGeneratedData.stickerName
        data.stickerTitle = newlyGeneratedData.stickerTitle
        data.sticker_idx = 1

        await this.modelCreateRecordFirstTime(newlyGeneratedData, ctx)
    }


    public static async findHighestUnusedIdx(ctx: CommandContext<Context>) {

        let StickerpackStateDoc = await stickerpackStateModel.findOne({
            user_id: ctx.message?.from.id!,
        });
        console.log(stickerpackStateModel)
        if (StickerpackStateDoc == null) {
            this.generateStickerPackDataFirstTime(ctx);

            // regenerate
            StickerpackStateDoc = await stickerpackStateModel.findOne({
                user_id: ctx.message?.from.id!,
            });
        }

        // console.log("debug old")
        // console.log(StickerpackStateDoc
        

        let highest = 0;

        if (StickerpackStateDoc?.stickersetname!.length != 0) {
            for (let i = 0; i < StickerpackStateDoc?.stickersetname?.length!; i++) {
                let reversedData: IStickerpackDataReversed = BotHelpers.reverseStickerpackName(StickerpackStateDoc?.stickersetname[i]!);

                if (reversedData.index > highest) {
                    highest = reversedData.index
                }
            }
        }

        // if (highest == 1) {
        //     return highest
        // } else {
        return highest + 1;
        // }

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

    /**
     * nb: sticker[] is a first 50 array of sticker
     * number is carry
     * return remaining sticker
     */
    public static get_first_50idx_sticker(stickers: StickerSet): [Sticker[], number, Sticker[]]
    {
        let remaining: number = (stickers.stickers.length - 50);
        return [
            stickers.stickers.slice(0, 50),
            (remaining < 0) ? 0 : remaining,
            (remaining > 0) ? stickers.stickers.slice(50) : []
        ];
            // ];
    }

}


// this is should be private
const createStickerpackAndAdd = async (ctx: CommandContext<Context>, stickers: Sticker[], stickerNew: IStickerpackData) => {
    let stickerInputTransformed: InputSticker[] = stickers.map((val: Sticker) => {
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
}

/**
 * get all sticker, loop for each sticker
 * then, append it to new stickerpacks
 */

const forkFromStickers = async (ctx: CommandContext<Context>) => {
    let stickerNew: IStickerpackData = await forkUtils.modelCreateRecordAndStickerpack(ctx);
    const stickers = await ctx.api.getStickerSet(ctx.message?.reply_to_message?.sticker?.set_name!)

    let [first_50x_sticker, carry, next_sticker] = await forkUtils.get_first_50idx_sticker(stickers);
    
    if (carry == 0) {
        // do once
        console.log(`len ${first_50x_sticker.length}`)
        await createStickerpackAndAdd(ctx, first_50x_sticker, stickerNew);
    } else {
        console.log(`len carry ${first_50x_sticker.length} | ${next_sticker.length}`)
        await createStickerpackAndAdd(ctx, first_50x_sticker, stickerNew);
        // let stickerInputTransformed: InputSticker[] = next_sticker.map((val: Sticker) => {
            
        let idx = 0;
        // next_sticker.forEach(async (val: Sticker) => {
        for(let i = 0; i < next_sticker.length; i++) {
            let input: InputSticker = {
                sticker: next_sticker[i].file_id!,
                emoji_list: split(next_sticker[i].emoji!),
                format: 'static',
            };
    
            let ret = await ctx.api.addStickerToSet(
                ctx.message?.from.id!,
                stickerNew.stickerName,
                input
            );
    
            console.log(`loop ${idx} = ${ret}` )
            idx = idx + 1;
        }
    }
    // let index: number = 0;
    // let stickerInputTransformed: InputSticker[] = {} as InputSticker[];

    // 

    

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
