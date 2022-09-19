import { IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { TextObjectType } from '@rocket.chat/apps-engine/definition/uikit';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { ICommentPayload, NewIUser } from '../definition';
import { blockAction } from '../enums/enums';
import { botMessageChannel, sendDMToUser } from '../lib/messages';
import { getAllUsers } from '../storage/users';

export async function commentEvent(
    room,
    read: IRead,
    roomData,
    user,
    payload: ICommentPayload,
    modify,
    comment,
    persistence
) {
    const block = modify.getCreator().getBlockBuilder();

    if (room) {
        let commentedBy: NewIUser | undefined;
        if (roomData.file_Ids || roomData.file_Ids!.length > 0) {
            // use this to find the user from the db who triggered the comment and tag him
            await getAllUsers(read)
                .then((users) => {
                    commentedBy = users.find(
                        (user) => user.figmaUserId === payload.triggered_by.id
                    );
                    commentedBy;
                })
                .catch((e) =>
                    console.log(
                        'error: finding user in db mentioned in comment - ',
                        e
                    )
                );
            if (roomData.file_Ids.includes(payload.file_key)) {
                // we can also mention the person who created the comment but if someone created a comment he/she should not get one more notificatin from rc.
                // const message = `@${commentedBy} commented on ${payload.file_name} - ${comment}`;
                const message = `${payload.triggered_by.handle} commented on ${payload.file_name}`;
                const commentText = `> ${comment}`;
                block.addSectionBlock({
                    text: {
                        type: TextObjectType.MARKDOWN,
                        text: message
                    }
                });

                block.addSectionBlock({
                    text: {
                        type: TextObjectType.MARKDOWN,
                        text: commentText
                    }
                });

                block.addActionsBlock({
                    blockId: blockAction.SUBSCRIPTIONS,
                    elements: [
                        block.newButtonElement({
                            actionId: blockAction.REPLY,
                            text: block.newPlainTextObject('Reply'),
                            value: {
                                commentId: payload.comment_id,
                                fileKey: payload.file_key
                            }
                        }),
                        // block.newButtonElement({
                        //     actionId: blockAction.REACT,
                        //     text: block.newPlainTextObject('Add Reaction'),
                        //     value: {
                        //         commentId: payload.comment_id,
                        //         fileKey: payload.file_key
                        //     }
                        // }),
                        block.newButtonElement({
                            actionId: blockAction.OPEN_FILE,
                            text: block.newPlainTextObject('Open file'),
                            url: `https://www.figma.com/file/${payload.file_key}`,
                            value: {
                                fileKey: payload.file_key,
                                commentId: payload.comment_id,
                                fileURL: `https://www.figma.com/file/${payload.file_key}`
                            }
                        })
                    ]
                });
                await botMessageChannel(read, modify, room, block);

                // also send dm to user for mentioning him in comment
                //if (commentedBy) {
                // find the tagged user
                // todo: handle the edge case if the a person is tagged multiple times
                payload.comment.forEach(async (key: { mention: string }) => {
                    if (key.mention) {
                        let taggedUser: IUser | undefined;
                        await getAllUsers(read)
                            .then(async (users) => {
                                const figmaUser: NewIUser | undefined =
                                    users.find(
                                        (user) =>
                                            user.figmaUserId === key.mention
                                    );
                                // get user from read using taggedUser.id
                                if (figmaUser) {
                                    taggedUser = await read
                                        .getUserReader()
                                        .getById(figmaUser?.id);
                                }
                            })
                            .catch((e) =>
                                console.log(
                                    'error finding user in db mentioned in comment - ',
                                    e
                                )
                            );
                        if (taggedUser) {
                            await sendDMToUser(
                                read,
                                modify,
                                taggedUser,
                                `${payload.triggered_by.handle} mentioned you in a comment on figma file  ${payload.file_name} - ${comment}`,
                                persistence
                            );
                        }
                    } else {
                        console.log('result: mention does not exist');
                    }
                });

                //	}
                //	await sendDMToUser(read, modify, user, 'you were mentioned in a comment', persistence);
            }
        } else if (
            (!roomData.file_Ids || roomData.file_Ids.length == 0) &&
            (roomData.project_Ids || roomData.project_Ids!.length > 0)
        ) {
            // files does not exist this means that there are projects in the room then if the project is present send the message to the room
            // for project we will have to store all the files we are getting from that project and then check if the file is present in the files array
            if (roomData.file_Ids?.includes(payload.file_key)) {
                const message = `${payload.triggered_by.handle} commented on ${payload.file_key}`;
                const commentText = `> ${comment}`;
                block.addSectionBlock({
                    text: {
                        type: TextObjectType.MARKDOWN,
                        text: message
                    }
                });
                block.addSectionBlock({
                    text: {
                        type: TextObjectType.MARKDOWN,
                        text: commentText
                    }
                });
                block.addActionsBlock({
                    blockId: blockAction.SUBSCRIPTIONS,
                    elements: [
                        block.newButtonElement({
                            actionId: blockAction.REPLY,
                            text: block.newPlainTextObject('Reply'),
                            value: {
                                commentId: payload.comment_id,
                                fileKey: payload.file_key
                            }
                        }),
                        // block.newButtonElement({
                        //     actionId: blockAction.REACT,
                        //     text: block.newPlainTextObject('Add Reaction'),
                        //     value: {
                        //         commentId: payload.comment_id,
                        //         fileKey: payload.file_key
                        //     }
                        // }),
                        block.newButtonElement({
                            actionId: blockAction.OPEN_FILE,
                            text: block.newPlainTextObject('Open file'),
                            url: `https://www.figma.com/file/${payload.file_key}`,
                            value: {
                                fileKey: payload.file_key,
                                commentId: payload.comment_id,
                                fileURL: `https://www.figma.com/file/${payload.file_key}`
                            }
                        })
                    ]
                });
                await botMessageChannel(read, modify, room, block);
            }
        } else if (!roomData.file_Ids && !roomData.project_Ids) {
            console.log(
                'error: roomData has no files or projects init - ',
                roomData
            );
            // both project ids and file ids array are undefined which means subscription is for the whole team
        }
    } else {
        console.log('result: figma pinged but room not found - ', roomData);
    }
}
