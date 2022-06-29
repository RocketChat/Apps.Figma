import {
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom, RoomType } from "@rocket.chat/apps-engine/definition/rooms";
import {
    BlockBuilder,
    IBlock,
} from "@rocket.chat/apps-engine/definition/uikit";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { NotificationsController } from "./notification";

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
        throw new error("Could not get direct room");
    }

    if (room) {
        return room;
    } else {
        let roomId: string;

        const newRoom = modify
            .getCreator()
            .startRoom()
            .setType(RoomType.DIRECT_MESSAGE)
            .setCreator(appUser)
            .setMembersToBeAddedByUsernames(usernames);
        roomId = await modify.getCreator().finish(newRoom);
        return await read.getRoomReader().getById(roomId);
    }
}

/**
 *
 * sends a message in the room/channel which is visible to everyone
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

    return await modify.getCreator().finish(msg);
}
export async function appUserSendMessage(
    read: IRead,
    modify: IModify,
    room: IRoom,
    blocks?: BlockBuilder | [IBlock]
): Promise<string> {
    const appUser = (await read.getUserReader().getAppUser()) as IUser;
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

    return await modify.getCreator().finish(msg);
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
 * Sends notification to the user which is only visible to user. (  Only you can see this message )
 */
export async function sendNotificationToUsers(
    read: IRead,
    modify: IModify,
    user: IUser,
    room: IRoom,
    message: string,
    blocks?: BlockBuilder
): Promise<void> {
    const appUser = (await read.getUserReader().getAppUser()) as IUser;

    const msg = modify
        .getCreator()
        .startMessage()
        .setSender(appUser)
        .setRoom(room)
        .setText(message);

    if (blocks) {
        msg.setBlocks(blocks);
    }
    console.log("sending notification");
    return read.getNotifier().notifyUser(user, msg.getMessage());
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
    blocks?: BlockBuilder | [IBlock]
): Promise<string> {
    const appUser = (await read.getUserReader().getAppUser()) as IUser;
    const targetRoom = (await getDirectRoom(
        read,
        modify,
        appUser,
        user.username
    )) as IRoom;
    const shouldSend = await shouldSendMessage(read, persistence, user);

    if (!shouldSend) {
        return "";
    }

    return await sendMessage(modify, targetRoom, appUser, message, blocks);
}
