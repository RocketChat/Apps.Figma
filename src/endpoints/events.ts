import {
    IHttp,
    IModify,
    IRead,
    IPersistence
} from '@rocket.chat/apps-engine/definition/accessors';
import { ICommentPayload, ISubscription } from '../definition';
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
                    'error finding user in db mentioned in comment - ',
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
    payload: ICommentPayload,
    subscriptions: ISubscription[],
    modify: IModify,
    read: IRead,
    http: IHttp
) {
    //
}
export async function updateEvent(
    payload: ICommentPayload,
    subscriptions: ISubscription[],
    modify: IModify,
    read: IRead,
    http: IHttp
) {
    //
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
    payload: ICommentPayload,
    subscriptions: ISubscription[],
    modify: IModify,
    read: IRead,
    http: IHttp
) {
    //
}
