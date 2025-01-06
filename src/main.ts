import dotenvx from '@dotenvx/dotenvx';
import { Bot , CommandContext, Context } from "grammy";
import { start_handler } from "./handler/start"

dotenvx.config();

const bot = new Bot(process.env.BOT_TOKEN!);

bot.command("start",  async (ctx: CommandContext<Context>) => {
        const handler = new start_handler(bot, ctx)
        await handler.run()
});


bot.start();