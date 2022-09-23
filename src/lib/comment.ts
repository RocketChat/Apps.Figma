/* eslint-disable no-mixed-spaces-and-tabs */
import {
    IHttp,
    IModify,
    IPersistence,
    IRead
} from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import {
    BlockElementType,
    TextObjectType,
    UIKitBlockInteractionContext
} from '@rocket.chat/apps-engine/definition/uikit';
import { modalId, modalTitle } from '../enums/enums';

export async function newComment(
    modify: IModify,
    context: UIKitBlockInteractionContext,
    persistence: IPersistence,
    read: IRead,
    data,
    room: IRoom,
    user: IUser,
    http: IHttp
) {
    const triggerId = context.getInteractionData().triggerId;

    const block = modify.getCreator().getBlockBuilder();
    block.addInputBlock({
        label: {
            text: 'Enter a new comment to the file',
            type: TextObjectType.PLAINTEXT
        },
        blockId: 'new_comment',
        element: {
            actionId: 'comment',
            placeholder: {
                text: 'Enter your comment',
                type: TextObjectType.PLAINTEXT
            },
            type: BlockElementType.PLAIN_TEXT_INPUT
        }
    });
    const commentData = context.getInteractionData().value?.split('/')[5];
    // for the opened block run the code

    const modal = {
        id: 'commentView',
        title: block.newPlainTextObject(modalTitle.CREATE_COMMENT_MODAL),
        submit: block.newButtonElement({
            actionId: 'createNewComment',
            text: {
                type: TextObjectType.PLAINTEXT,
                text: 'Post Comment'
            }
        }),
        commentData: commentData,
        blocks: block.getBlocks()
    };

    return await modify.getUiController().openModalView(
        modal,
        {
            triggerId
        },
        user
    );

    //botNotifyCurrentUser(read, modify, user, room, 'Post your reply', block);
}
