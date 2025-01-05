import dotenvx from '@dotenvx/dotenvx';
import { Bot } from "grammy";

dotenvx.config();

const bot = new Bot(process.env.BOT_TOKEN!);

bot.command("start", (ctx) => ctx.reply("Welcome! Up and running."));
bot.start();