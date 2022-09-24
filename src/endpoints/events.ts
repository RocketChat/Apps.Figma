import {
    IHttp,
    IModify,
    IRead,
    IPersistence
} from '@rocket.chat/apps-engine/definition/accessors';
import {
    BlockElementType,
    TextObjectType
} from '@rocket.chat/apps-engine/definition/uikit';
import {
    ICommentPayload,
    IDeletePayload,
    ISubscription,
    IVersionUpdatePayload,
    NewIUser
} from '../definition';
import { blockAction, events } from '../enums/enums';
import { getRequest } from '../helpers/Figma.sdk';
import { botMessageChannel, botNormalMessageChannel } from '../lib/messages';
import { getAllUsers } from '../storage/users';
import { commentEvent as useCommentEvent } from './commentEvent';

export async function commentEvent(
    payload: ICommentPayload,
    subscriptions: ISubscription[],
    modify: IModify,
    read: IRead,
    http: IHttp,
    persistence: IPersistence
) {
    let comment = ''; // todo : fix the comment text

    if (payload.comment.length >= 2) {
        await getAllUsers(read)
            .then((users) => {
                payload.comment.forEach((element: any) => {
                    if (element.mention) {
                        const user = users.find(
                            (user) => user.figmaUserId === element.mention
                        );
                        if (user) {
                            comment += `@${user.username} `;
                        } else {
                            comment += `${element.text} `;
                        }
                    } else {
                        comment += element.text;
                    }
                });
            })
            .catch((e) =>
                console.log(
                    'error: finding user in db mentioned in comment - ',
                    e
                )
            );
    } else {
        comment = payload.comment[0].text;
    }
    // now send a message with comment as quote to all the subscribed users
    for (const subscription of subscriptions) {
        for (const roomData of subscription.room_data) {
            const room = await read.getRoomReader().getById(roomData.room_Id!);

            const user = await read
                .getUserReader()
                .getById(subscription.user_id);
            // split this into multiple files
            await useCommentEvent(
                room,
                read,
                roomData,
                user,
                payload,
                modify,
                comment,
                persistence
            );
        }
    }
}
export async function deleteEvent(
    payload: IDeletePayload,
    subscriptions: ISubscription[],
    modify: IModify,
    read: IRead,
    http: IHttp
) {
    // send request to ffigma if that file exists in figma only then proceed further
    if (payload.event_type !== events.DELETE) return;

    // find user by payload.triggered_by.id
    // get user id from db which was stored while authenticating
    let deletedBy: NewIUser | undefined;
    await getAllUsers(read).then((user) => {
        deletedBy = user.find(
            (user) => user.figmaUserId === payload.triggered_by.id
        );
    });

    for (const subscription of subscriptions) {
        for (const roomData of subscription.room_data) {
            const room = await read.getRoomReader().getById(roomData.room_Id!);
            if (!room) {
                console.log('error: no room found ');
                return;
            }
            // check if the current room contains the file inside file_ids array
            if (roomData.file_Ids?.includes(payload.file_key)) {
                if (deletedBy) {
                    // send message with deleteBy to all the users in the room
                    await botNormalMessageChannel(
                        read,
                        modify,
                        room,
                        `File: ${payload.file_name} was deleted by @${deletedBy.username}`
                    );
                } else {
                    await botNormalMessageChannel(
                        read,
                        modify,
                        room,
                        `File: ${payload.file_name} was deleted by @${payload.triggered_by.handle}`
                    );
                }
            } else {
                console.log(
                    'RESULT: the file which was deleted is not subscribed by the user'
                );
            }
        }
    }
}
export async function updateEvent(
    payload: ICommentPayload,
    subscriptions: ISubscription[],
    modify: IModify,
    read: IRead,
    http: IHttp
) {
    // console.log('payload for file saved - ', payload);
}
export async function publishEvent(
    payload: ICommentPayload,
    subscriptions: ISubscription[],
    modify: IModify,
    read: IRead,
    http: IHttp
) {
    //
}
export async function versionUpdateEvent(
    payload: IVersionUpdatePayload,
    subscriptions: ISubscription[],
    modify: IModify,
    read: IRead,
    http: IHttp
) {
    // send request to ffigma if that file exists in figma only then proceed further
    if (payload.event_type !== events.VERSION_UPDATE) return;
    // find user by payload.triggered_by.id
    // get user id from db which was stored while authenticating
    let versionAddedBy: NewIUser | undefined;
    await getAllUsers(read).then((user) => {
        versionAddedBy = user.find(
            (user) => user.figmaUserId === payload.triggered_by.id
        );
    });
    for (const subscription of subscriptions) {
        for (const roomData of subscription.room_data) {
            const room = await read.getRoomReader().getById(roomData.room_Id!);
            if (!room) {
                return;
            }
            // check if the current room contains the file inside file_ids array
            let message: string | undefined = undefined;
            if (roomData.file_Ids?.includes(payload.file_key)) {
                if (payload.description.length > 0) {
                    message = `Description: ${payload.description}`;
                }
                if (versionAddedBy) {
                    // send message with deleteBy to all the users in the room
                    const sendMessage = await botNormalMessageChannel(
                        read,
                        modify,
                        room,
                        `@${versionAddedBy?.username} added a new version: *${
                            payload?.label
                        }* of the file: [${
                            payload?.file_name
                        }](https://www.figma.com/file/${payload?.file_key}/${
                            payload?.file_name
                        }?version-id=${payload?.version_id}) \n ${
                            message && message
                        }`
                    );
                    console.log('was message sent ', sendMessage);
                } else {
                    await botNormalMessageChannel(
                        read,
                        modify,
                        room,
                        `${
                            payload?.triggered_by?.handle
                        } added a new version: *${
                            payload?.label
                        }* of the file: [${
                            payload?.file_name
                        }](https://www.figma.com/file/${payload?.file_key}/${
                            payload?.file_name
                        }?version-id=${payload?.version_id}) \n ${
                            message && message
                        }`
                    );
                }
            } else {
                console.log(
                    'RESULT: this file is not subscribed by the user so no need to send message'
                );
            }
        }
    }
}
