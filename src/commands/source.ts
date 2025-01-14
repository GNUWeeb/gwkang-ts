import { createCommand } from '../utils/command';
import { CommandContext, Context } from 'grammy';
import { ReplyParameters } from 'grammy/types';
import { InlineKeyboard } from 'grammy';
import { IStickerpackData } from '../helper/strings';
import axios from "axios";
import * as fs from "fs";
import { config } from '../utils/config';
import FormData = require('form-data');

const uploadImage = async (filePath: string): Promise<any> => {
    try {
        // Read file as base64
        const fileContent = fs.readFileSync(filePath, { encoding: "base64" });

        const form = new FormData();
        form.append('key', config.IMGBB_TOKEN);
        form.append('image', fs.createReadStream(filePath));

        let data = await axios.post('https://api.imgbb.com/1/upload', form);
        
        if (data.status == 200) {
            return data.data
        }
        
        // const response = await axios()

        // Return response data
        // return response.data;
    } catch (error) {
        console.error("Error uploading image:", error);
        throw new Error("something error");
    }
}


const buildButton = async (ctx: CommandContext<Context>, url: string) => {
    let replyparam: ReplyParameters = {
        message_id: ctx.message?.message_id!,
    };

    let keyboardData: InlineKeyboard = new InlineKeyboard()
        .url("Saucenao", `https://saucenao.com/search.php?url=${url}`)
        .url("Google", `https://lens.google.com/uploadbyurl?url=${url}`)
        .row()


    await ctx.reply("search image", {
        reply_parameters: replyparam,
        reply_markup: keyboardData
    });
}

const doReverseImage = async (ctx: CommandContext<Context>) => {


    const largestphoto = ctx.message?.reply_to_message?.photo?.pop();
    const file: any = await ctx.api.getFile(largestphoto?.file_id!);

    const tempDataPath = await file.download();
    // console.log(tempDataPath);
    let data: any = await uploadImage(tempDataPath)
    // console.log(data)

    await buildButton(ctx, data.data.url)

}

const doReverseSticker = async (ctx: CommandContext<Context>) => {

    const file: any = await ctx.api.getFile(ctx.message?.reply_to_message?.sticker?.file_id!);

    const tempDataPath = await file.download();
    // console.log(tempDataPath);
    let data: any = await uploadImage(tempDataPath)
    // console.log(data)

    await buildButton(ctx, data.data.url)

}

const sourceCommand = createCommand(
    {
        name: 'source',
        alias: ['sauce'],
        description: 'Search image',
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
            await doReverseSticker(ctx);
        }
        else if (
            ctx.message?.reply_to_message?.photo != undefined &&
            ctx.message?.reply_to_message?.sticker == undefined
        ) {
            await doReverseImage(ctx);
        } else {
            await ctx.reply("please reply a sticker", {
                reply_parameters: replyparam
            })
        }
    }
);

export default sourceCommand;
