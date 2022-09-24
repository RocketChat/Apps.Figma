/* eslint-disable prefer-const */
import {
    IModify,
    IPersistence,
    IRead
} from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom, RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import {
    BlockBuilder,
    IBlock
} from '@rocket.chat/apps-engine/definition/uikit';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { NotificationsController } from './notification';

export async function getDirectRoom(
    read: IRead,
    modify: IModify,
    appUser: IUser,
    username: string
): Promise<IRoom | undefined> {
    const usernames = [appUser.username, username];

    let room: IRoom;
    try {
        room = await read.getRoomReader().getDirectByUsernames(usernames);
    } catch (error) {
        throw new error('Could not get direct room');
    }

    if (room) {
        return room;
    }

    let roomId: string;

    const newRoom = modify
        .getCreator()
        .startRoom()
        .setType(RoomType.DIRECT_MESSAGE)
        .setCreator(appUser)
        .setMembersToBeAddedByUsernames(usernames);
    roomId = await modify.getCreator().finish(newRoom);
    return read.getRoomReader().getById(roomId);
}

/**
 *
 * Sends a message in the room/channel which is visible to everyone
 */
export async function sendMessage(
    modify: IModify,
    room: IRoom,
    sender: IUser,
    message: string,
    blocks?: BlockBuilder | [IBlock]
): Promise<string> {
    const msg = modify
        .getCreator()
        .startMessage()
        .setSender(sender)
        .setRoom(room)
        .setGroupable(false)
        .setParseUrls(false)
        .setText(message);

    if (blocks !== undefined) {
        msg.setBlocks(blocks);
    }

    return modify.getCreator().finish(msg);
}
/**
 *
 * figma bot will message all the users inside the channel
 */
export async function botMessageChannel(
    read: IRead,
    modify: IModify,
    room: IRoom,
    blocks?: BlockBuilder | [IBlock]
): Promise<string> {
    const appUser = await read.getUserReader().getAppUser();
    if (appUser) {
        const msg = modify
            .getCreator()
            .startMessage()
            .setSender(appUser)
            .setRoom(room)
            .setGroupable(false)
            .setParseUrls(false);
        if (blocks !== undefined) {
            msg.setBlocks(blocks);
        }
        modify.getCreator().finish(msg);
        return 'message sent successfully';
    }
    console.log(
        'error: app user not found user reader - ',
        read.getUserReader()
    );
    return '';
}
export async function botNormalMessageChannel(
    read: IRead,
    modify: IModify,
    room: IRoom,
    message: string,
    blocks?: BlockBuilder | [IBlock]
): Promise<string> {
    const appUser = await read.getUserReader().getAppUser();
    if (appUser) {
        const msg = modify
            .getCreator()
            .startMessage()
            .setSender(appUser)
            .setRoom(room)
            .setGroupable(false)
            .setParseUrls(false)
            .setText(message);
        console.log('msg', msg);
        if (blocks !== undefined) {
            msg.setBlocks(blocks);
        }
        return modify.getCreator().finish(msg);
    }
    console.log(
        'error: app user not found user reader - ',
        read.getUserReader()
    );
    return '';
}
export async function shouldSendMessage(
    read: IRead,
    persistence: IPersistence,
    user: IUser
): Promise<boolean> {
    const notificationsController = new NotificationsController(
        read,
        persistence,
        user
    );
    const notificationStatus =
        await notificationsController.getNotificationsStatus();
    return notificationStatus ? notificationStatus.status : true;
}

/**
 *
 * Figma.bot sends notification inside the current room to the current user
 */
export async function botNotifyCurrentUser(
    read: IRead,
    modify: IModify,
    user: IUser,
    room: IRoom,
    message: string,
    blocks?: BlockBuilder
): Promise<void> {
    const appUser = await read.getUserReader().getAppUser()!;
    if (appUser) {
        const msg = modify
            .getCreator()
            .startMessage()
            .setSender(appUser)
            .setRoom(room)
            .setText(message);
        if (blocks) {
            msg.setBlocks(blocks);
        }
        return read.getNotifier().notifyUser(user, msg.getMessage());
    }
}

/**
 *
 * User will receive a direct message by figma.bot.
 */
export async function sendDMToUser(
    read: IRead,
    modify: IModify,
    user: IUser,
    message: string,
    persistence: IPersistence,
    blocks?: BlockBuilder
): Promise<string> {
    const appUser: IUser | undefined = await read.getUserReader().getAppUser();
    if (appUser) {
        const targetRoom = await getDirectRoom(
            read,
            modify,
            appUser,
            user.username
        )!;
        if (targetRoom) {
            const shouldSend = await shouldSendMessage(read, persistence, user);

            if (!shouldSend) {
                return '';
            }

            return sendMessage(modify, targetRoom, appUser, message, blocks);
        }
    }
    return '';
}
