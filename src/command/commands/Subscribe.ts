import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import {
    IRead,
    IModify,
    IHttp,
    IPersistence
} from '@rocket.chat/apps-engine/definition/accessors';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { sendDMToUser, botNotifyCurrentUser } from '../../lib/messages';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { getAccessTokenForUser } from '../../storage/users';
import { uuid } from '../../lib/uuid';
import { subscriptionsModal } from '../../modals/subscription';
import { storeInteractionRoomData } from '../../storage/room';

export async function figmaSubscribeCommand(
    context: SlashCommandContext,
    read: IRead,
    modify: IModify,
    http: IHttp,
    persistence: IPersistence,
    room: IRoom,
    sender: IUser,
    id?: string
) {
    const viewId = id || uuid();
    const accessToken = await getAccessTokenForUser(read, sender);

    if (!accessToken?.token) {
        const message =
            'Your have not connected your account yet. Use `/figma connect` to connect your account.';
        await botNotifyCurrentUser(read, modify, sender, room, message);
        return;
    }

    if (room.type === 'd') {
        const message =
            'You can only subscribe to files inside a channel for notifications. Try `/figma help`  ';
        await sendDMToUser(read, modify, sender, message, persistence);
        return;
    }

    await storeInteractionRoomData(persistence, sender.id, viewId);

    const triggerId = context.getTriggerId();
    if (triggerId) {
        const modal = await subscriptionsModal({
            modify: modify,
            read: read,
            persistence: persistence,
            SlashCommandContext: context
        });
        await modify.getUiController().openModalView(
            modal,
            {
                triggerId
            },
            context.getSender()
        );
    } else {
        console.log('Invalid Trigger ID !');
    }
}
