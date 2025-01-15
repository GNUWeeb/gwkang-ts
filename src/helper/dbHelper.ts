import { stickerpackStateModel } from "../models/stickerpackState";

export class dbHelper {
    public static async appendNewStickerSetToUID(user_id: number, newStickersetName: string) {
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


    public static async removeStickerSetFromUID(user_id: number, stickersetName: string) {
        let old = await stickerpackStateModel.findOne({
            user_id: user_id
        });

        let repackArr: string[] = old?.stickersetname!;
        const index = repackArr.indexOf(stickersetName);
        if (index > -1) { // only splice array when item is found
            repackArr.splice(index, 1); // 2nd parameter means remove one item only
        }

        await stickerpackStateModel.updateOne(
            {
                user_id: user_id
            },
            {
                stickersetname: repackArr
            }
        )
    }
}