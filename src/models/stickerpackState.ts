import { Schema, model } from 'mongoose';

/**
 * this models represent current active, you can /kang without any parameters
 * 
 * convention: a_{index}_{user_id}_by_{botname}
 * example: a_1_5892885430_by_nekonakobot
 * 
 * so we can use index in order to refer corresponding sticker
 */

// const stickersetnameSchema = new Schema(
//   {
//     set_name: { type: String, required: true },
//   }, {
    
//   }
// )

const stickerpackStateSchema = new Schema(
  {
    user_id: { type: Number, required: true },
    current: { type: String, required: false },  /* PROBABLY deprecated in future */
    stickersetname: { type: [String], required: true },
  },
  { collection: 'stickerpack_state', timestamps: true }
);

export const stickerpackStateModel = model('stickerpack_state', stickerpackStateSchema);
