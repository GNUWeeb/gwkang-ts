import { Bot, CommandContext, Context, Api, RawApi } from "grammy";
import { Base } from "./base"

export class start_handler extends Base {
        private ctx: CommandContext<Context>
        private bot: Bot<Context, Api<RawApi>>
        
        constructor(bot: Bot<Context, Api<RawApi>>, ctx: CommandContext<Context>) {
                super();
                this.ctx = ctx
                this.bot = bot;
        }

        async run(): Promise<number> {
                await this.bot.api.sendMessage(
                        this.ctx.chat.id, 
                        "Hello! I'm sticker kanging bot. write /hellp for help.");
                return 0;
        }

}