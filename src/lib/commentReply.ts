/* eslint-disable no-mixed-spaces-and-tabs */
import {IHttp,
	IModify,
	IPersistence,
	IRead} from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { BlockElementType, TextObjectType, UIKitBlockInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';

export async function commentReply(
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
			text: 'Enter reply to the comment here',
			type: TextObjectType.PLAINTEXT,
		},
		blockId: 'comment_reply',
		element: {
			actionId: 'reply',
			placeholder: {
				text: 'Reply...',
                type: TextObjectType.PLAINTEXT,
			},
			type: BlockElementType.PLAIN_TEXT_INPUT,
		},
	});

	let commentData: any;
	context.getInteractionData().message?.blocks?.forEach((block: any) => {
    	if (block)
    	{
    		if (block.type === 'actions') {
    			commentData = block?.elements[1].value;
			}
    	} else {
    		console.log('error: block is undefined - ', block);
    	}
    	return;
	});

	const modal = {
    	id: 'replyView',
    	title: block.newPlainTextObject('Reply to Comment'),
    	submit: block.newButtonElement({
    		actionId: 'replyModalSubmit',
    		text: {
    			type: TextObjectType.PLAINTEXT, text: 'Post Reply'
    		},
    	}),
    	commentData: commentData,
    	blocks: block.getBlocks(),
	};

	return await modify
    	.getUiController()
    	.openModalView(modal, {
    		triggerId
    	}, user);

	//botNotifyCurrentUser(read, modify, user, room, 'Post your reply', block);
}
