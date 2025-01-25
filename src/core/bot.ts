import { Bot, InputFile } from 'grammy';
import { config } from '../utils/config';
import { connectDatabase } from './database';
import { middlewares } from '../registry';
import { logger } from '../utils/logger';
import { GwKangOptions, Context } from './types';
import { getCommands, registerCommands } from '../utils/command';
import { hydrateFiles } from "@grammyjs/files";
import { createTempFileWithContent } from '../helper/io';
import { BotHelpers } from '../helper/strings';

async function setupCommands(bot: Bot<Context>, options: GwKangOptions): Promise<void> {
  if (options.setMyCommands) {
    try {
      const commands = Array.from(getCommands().values());
      await bot.api.setMyCommands(
        commands.map(cmd => ({
          command: cmd.name,
          description: cmd.description,
        }))
      );
      logger.info('Successfully registered bot commands with Telegram API');
    } catch (error) {
      logger.warn(
        'Failed to register bot commands with Telegram API. auto-completion will not work'
      );
    }
  }
}

async function setupMiddlewares(bot: Bot<Context>): Promise<void> {
  middlewares.forEach(middleware => bot.use(middleware));
  logger.info('Successfully registered rate limit and other middlewares');
}

async function initializeDatabase(bot: Bot<Context>): Promise<void> {
  const db = await connectDatabase();
  bot.use(db.middleware);
  logger.info('Successfully established database connection');
}

async function setupErrHandler(bot: Bot<Context>): Promise<void> {
  bot.catch(async (err) => {

    let errstr: string = 
      `error message: ${String(err)}` +
      `trace: ${String(err.stack)}` +
      `details: ${JSON.stringify(err, BotHelpers.getCircularReplacer(), 2)}`.trim();

    let path: string = await createTempFileWithContent(errstr);

    let input: InputFile = new InputFile(path);

    await err.ctx.api.sendDocument(config.ERR_REPORT_CHAT_ID, input);
  })
}

export async function createBot(options: GwKangOptions = {}): Promise<Bot<Context>> {
  const bot = new Bot<Context>(config.BOT_TOKEN, options.bot);

  bot.api.config.use(hydrateFiles(config.BOT_TOKEN));

  await initializeDatabase(bot);
  await setupMiddlewares(bot);
  await setupCommands(bot, options);
  await setupErrHandler(bot);
  registerCommands(bot);
  logger.info('Successfully registered command handlers');

  logger.info('Bot initialization completed. waiting until bot is started...');
  return bot;
}
