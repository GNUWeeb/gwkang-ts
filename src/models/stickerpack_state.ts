import { Schema, model } from 'mongoose';


interface Istickerpack_state {
        user_id: number
        current: string
}

const stickerpack_state_schema = new Schema<Istickerpack_state>(
        {
                user_id: { type: Number, required: true },
                current: { type: String, required: true }

        }
)

const User = model<Istickerpack_state>('User', stickerpack_state_schema);



export default User