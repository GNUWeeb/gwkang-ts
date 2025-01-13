import rateLimit from './middleware/rateLimit';
import ping from './commands/ping';
import start from './commands/start';
import kang from './commands/kang';
import debug from './commands/debug';
import { MiddlewareHandler, CommandHandler } from './core/types';
import { model } from 'mongoose';
import { UserSchema } from './models/user';
import unkang from './commands/unkang';
import toImage from './commands/toimage';
import help from './commands/help';
import packinfo from './commands/packinfo';
import mypacksCommand from './commands/mypack';

export const middlewares: MiddlewareHandler[] = [
  rateLimit,
  // Add more middlewares here
];

export const commands: CommandHandler[] = [
  ping,
  start,
  kang,
  debug,
  toImage,
  unkang,
  help,
  packinfo,
  mypacksCommand,
  // Add more commands here
];

export const models = [
  model('User', UserSchema),
  // Add more models here
];
