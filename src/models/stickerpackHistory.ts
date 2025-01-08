import { Schema, model } from 'mongoose';

/**
 * this models represent all sticker pack that have been created, you can select it
 */

/**
 * convention: a_{index}_{user_id}_by_{botname}
 * example: a_1_5892885430_by_nekonakobot
 * 
 * so we can use index in order to refer corresponding sticker
 */

const stickerpackStateSchema = new Schema(
  {
    user_id: { type: Number, required: true },
    stickername: { type: [String], required: true },    /* list of sticker */
  },
  { collection: 'stickerpack_history' }
);

export const stickerpackHistoryModel = model('stickerpack_history', stickerpackStateSchema);
