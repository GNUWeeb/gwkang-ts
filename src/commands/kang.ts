import { createCommand } from '../utils/command';
import { invalidInput, kangStickerRequestedNotFound } from '../helper/errors';
import { stickerpackStateModel } from '../models/stickerpackState';
import { CommandContext, Context, GrammyError } from 'grammy';
import { InputFile, InputSticker, Message } from 'grammy/types';
import { BotHelpers, IStickerpackData, IEmojiSanitizeResult, IStickerpackDataReversed } from '../helper/strings';
import { apiHelper } from '../helper/apiHelper';
import { downloadFileToTemp } from '../helper/io';
import sharp from 'sharp';
import { ReplyParameters } from 'grammy/types';
import { StickerRequestedNotFound } from '../error/stickerRequestedNotFound';
import { EmojiInputInvalid } from '../error/EmojiInputInvalid';
import { IndexPackInvalid } from '../error/IndexPackInvalid';
import { KangInputInvalid } from '../error/KangInputInvalid';
import { logger } from '../utils/logger';

interface stickerPackManagementCacheData {
    packIsFound: boolean; /* represents current pack is found or not */
}

class stickerPackManagement {
    private ctx: CommandContext<Context>;
    private data: IStickerpackData = {} as IStickerpackData;
    private cacheData: stickerPackManagementCacheData = {
        packIsFound: false
    } as stickerPackManagementCacheData;

    constructor(ctx: CommandContext<Context>) {
        this.ctx = ctx;
    }

    /**
     * create newly blank data for new users with initial first sticker pack
     */
    private async modelCreateRecordFirstTime(data: IStickerpackData) {
        let stickersetArr: string[] = [] as string[];

        // stickersetArr.push(data.stickerName);

        let db = new stickerpackStateModel({
            user_id: this.ctx.message?.from.id!,
            stickersetname: stickersetArr
        })

        await db.save();
    }

    private async findCurrentHighestIdx(stickerNameArr: string[]) {
        let highest = 1;

        for (let i = 0; i < stickerNameArr.length; i++) {
            let reversedData: IStickerpackDataReversed = await BotHelpers.reverseStickerpackName(stickerNameArr[i]);

            if (reversedData.index > highest) {
                highest = reversedData.index
            }
        }

        console.log(highest)

        return highest;
    }

    private async getHighestStickerpackName(stickerNameArr: string[]) {
        let highestIdx = await this.findCurrentHighestIdx(stickerNameArr);
        let generatedName: IStickerpackData = await BotHelpers.genStickerpackName(this.ctx, highestIdx);
        return generatedName.stickerName
    }

    private async appendNewStickerSetToUID(user_id: number, newStickersetName: string) {
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

    private async addStickerToPack(stickerFileId: string):
        Promise<boolean> {
        let input: InputSticker = {
            sticker: stickerFileId!,
            emoji_list: this.data.emoji,
            format: 'static',
        };

        return await this.ctx.api.addStickerToSet(
            this.ctx.message?.from.id!,
            this.data.stickerName,
            input
        );
    }

    private async createNewStickerpack(
        stickerFileId: string,
    ): Promise<boolean> {
        // let stickerData: IStickerpackData = await BotHelpers.genRandomStickerpackName(ctx);

        let input: InputSticker[] = [
            {
                sticker: stickerFileId!,
                emoji_list: this.data.emoji, // test
                format: 'static',
            },
        ];

        /* return true on success */
        return await this.ctx.api.createNewStickerSet(
            this.ctx.message?.from.id!,
            this.data.stickerName,
            this.data.stickerTitle!,
            input
        );
    };

    private async getIncreasedIdx(): Promise<IStickerpackData> {
        const StickerpackStateDoc = await stickerpackStateModel.findOne({
            user_id: this.ctx.message?.from.id!,
        });

        let highestIdx: number = await this.findCurrentHighestIdx(StickerpackStateDoc?.stickersetname!);

        highestIdx++;

        let newlyGeneratedData: IStickerpackData = await BotHelpers.genStickerpackName(
            this.ctx,
            highestIdx
        );

        this.data.stickerName = newlyGeneratedData.stickerName
        this.data.stickerTitle = newlyGeneratedData.stickerTitle
        this.data.sticker_idx = highestIdx

        return this.data;
    }

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
    public async parseInput(): Promise<this> {

        this.data = {} as IStickerpackData;
        let splitted: string[] = this.ctx.message?.text.split(' ')!;
        let commandValue = BotHelpers.getValueFromCommands(this.ctx.message?.text!)

        /**
         * do not touch
         * 
         * 1 is default value, 0 when unspesified
         */
        let stickerPackIdx: number = 1;

        if (splitted.length == 3) {
            /**
             * index structure
             * 1: pack number
             * 2: emoji
             */
            let result: IEmojiSanitizeResult = await BotHelpers.validateEmojiString(splitted[2]);
            if (result.code == -1) {
                throw new EmojiInputInvalid();
            } else {
                this.data.emoji = result.splitted

                /**
                 * handle error when pack such "/pack abc ❤️"
                 */
                if (BotHelpers.isInt(splitted[1])) {
                    stickerPackIdx = parseInt(splitted[1]);
                } else {
                    throw new IndexPackInvalid();
                }

            }
        } else if (splitted.length == 2) {
            /**
             * index 
             * 
             * 1: can be pack number or emoji
             * if emoji present, use default pack, and split the emoji
             * 
             * and use 😁 as default emoji
             */
            let testEmoji: IEmojiSanitizeResult = await BotHelpers.validateEmojiString(splitted[1]);
            if (testEmoji.code == -1) {
                if (BotHelpers.isInt(splitted[1])) {
                    stickerPackIdx = parseInt(splitted[1]);
                    this.data.emoji = ['😁']
                } else {
                    throw new KangInputInvalid();
                    /* not a emoji or number */
                }
            } else {
                if (BotHelpers.isInt(splitted[1])) {
                    stickerPackIdx = parseInt(splitted[1]);
                    this.data.emoji = ['😁']
                } else {
                    this.data.emoji = testEmoji.splitted
                    // use highest idx
                }
            }
        } else if (splitted.length == 1) {
            this.data.emoji = ['😁']
        } else {
            throw new KangInputInvalid()
        }

        const StickerpackStateDoc = await stickerpackStateModel.findOne({
            user_id: this.ctx.message?.from.id!,
        });

        if (StickerpackStateDoc === null) {
            /**
             * data not found, generate new, sticker title is essential for generation 
             * do not care about index, new sticker always start from 1
             * 
             * then replace the prev data with new one
             */
            let newlyGeneratedData: IStickerpackData = await BotHelpers.genStickerpackName(this.ctx, 1);

            this.data.stickerName = newlyGeneratedData.stickerName
            this.data.stickerTitle = newlyGeneratedData.stickerTitle
            this.data.sticker_idx = 1

            await this.modelCreateRecordFirstTime(newlyGeneratedData)
            /**
             * now, db and runtime is synced!
             */

            return this
        } else {
            if (commandValue == null) {
                /**
                 * handle when no args is provided, use default mode
                 * 
                 * in this section, sticker title might unused, because telegram already hold it
                 */

                this.data.stickerTitle = null;
                this.data.stickerName = await this.getHighestStickerpackName(StickerpackStateDoc.stickersetname);
                this.data.emoji = ['😁']
                this.data.sticker_idx = await this.findCurrentHighestIdx(StickerpackStateDoc.stickersetname);

                /* in this section, the sticker is always found, except if removed by users */
                this.cacheData.packIsFound = await apiHelper.checkStickerPack(this.ctx, this.data.stickerName);

                return this
            } else {
                /**
                 * already parsed in first session, where stickerpackIdx is separated,
                 * also get highest value of stickerpackdx
                 */

                let predicted: IStickerpackData = await BotHelpers.genStickerpackName(this.ctx, stickerPackIdx);
                let isFound: boolean = await apiHelper.checkStickerPack(this.ctx, predicted.stickerName);
                if (isFound) {
                    this.data.stickerTitle = null;
                    this.data.stickerName = predicted.stickerName;
                    this.data.sticker_idx = stickerPackIdx;
                    this.cacheData.packIsFound = isFound;

                    return this;
                } else {
                    throw new StickerRequestedNotFound();
                }

            }
        }
    }

    public exportStickerData(): IStickerpackData {
        return this.data;
    }

    public async addStickerToSetORCreate(stickerFileId: string): Promise<boolean> {
        if (this.cacheData.packIsFound) {
            try {
                let ret = await this.addStickerToPack(stickerFileId);
                return ret
            } catch (err: any) {
                if (err instanceof GrammyError) {
                    if (err.description == "Bad Request: STICKERS_TOO_MUCH") {
                        await this.getIncreasedIdx()

                        
                        let ret = await this.createNewStickerpack(stickerFileId);

                        if (ret) {
                            await this.appendNewStickerSetToUID(
                                this.ctx.message?.from.id!,
                                this.data.stickerName!
                            );

                        }
                        return ret;
                    }
                }
            }

        } else {
            /**
             * create sticker here, and append to new list
             */
            try {
                let ret = await this.createNewStickerpack(stickerFileId);

                if (ret) {
                    await this.appendNewStickerSetToUID(
                        this.ctx.message?.from.id!,
                        this.data.stickerName!
                    );

                }
                return ret;
            } catch (err: any) {
                if (err instanceof GrammyError) {
                    console.log(err)
                }
            }


        }

        return true;
    }
}

const kangFromSticker = async (
    ctx: CommandContext<Context>,
    stickerManagementCtx: stickerPackManagement
): Promise<void> => {
    /* setup reply id */
    let replyparam: ReplyParameters = {
        message_id: ctx.message?.message_id!,
    };

    await stickerManagementCtx.addStickerToSetORCreate(ctx.message?.reply_to_message?.sticker?.file_id!)

    let stickerData: IStickerpackData = await stickerManagementCtx.exportStickerData();

    await ctx.reply(
        `New sticker <a href='https://t.me/addstickers/${stickerData.stickerName}'>#pack_${stickerData.sticker_idx}</a> Kanged!`,
        {
            reply_parameters: replyparam,
            parse_mode: 'HTML',
        }
    );
};

const kangCommand = createCommand(
    {
        name: 'kang',
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

            try {
                let stickerManagementCtx: stickerPackManagement = new stickerPackManagement(ctx);
                await stickerManagementCtx.parseInput();

                await ctx.reply(JSON.stringify(stickerManagementCtx.exportStickerData()), {
                    reply_parameters: replyparam
                })
                if (
                    ctx.message?.reply_to_message?.sticker! != undefined &&
                    ctx.message?.reply_to_message?.photo == undefined
                ) {
                    await kangFromSticker(ctx, stickerManagementCtx);
                }
                //  else if (
                //     ctx.message?.reply_to_message?.photo != undefined &&
                //     ctx.message?.reply_to_message?.sticker == undefined
                // ) {
                //     await kangFromImage(ctx, stickerDataPredicted);
                // } else {
                //     await invalidInput(ctx);
                // }
            } catch (err: any) {
                console.log(err)
                await ctx.reply(err.message, {
                    reply_parameters: replyparam
                })
            }

        }
    }
);

export default kangCommand;
