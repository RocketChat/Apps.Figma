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

    let commentData: any;
    console.log('data - ', context.getInteractionData().message?.blocks);
    // for the opened block run the code
    context.getInteractionData().message?.blocks?.forEach((block: any) => {
        if (block) {
            if (block.type === 'actions') {
                block?.elements.forEach((element) => {
                    // check if the element is active or not
                    console.log(element);
                    if (element.type === 'active') {
                        console.log('element is active');
                    } else {
                        console.log('element is not active');
                    }
                });
                //commentData = block?.elements[1].value;
            }
            //console.log('commentId', commentId);
        } else {
            console.log('block is undefined - ', block);
        }
        return;
    });

    const modal = {
        id: 'commentView',
        title: block.newPlainTextObject('Create a new Comment'),
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
