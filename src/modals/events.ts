import {IHttp,
	IModify,
	IPersistence,
	IRead,} from '@rocket.chat/apps-engine/definition/accessors';
import {BlockElementType,
	ITextObject,
	TextObjectType,} from '@rocket.chat/apps-engine/definition/uikit/blocks';
import {IUIKitModalViewParam} from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';
import {IUser} from '@rocket.chat/apps-engine/definition/users';
// Import { getRoomTasks, getUIData, persistUIData } from '../lib/persistence';
import {SlashCommandContext} from '@rocket.chat/apps-engine/definition/slashcommands';
import {UIKitBlockInteractionContext,
	UIKitInteractionContext,} from '@rocket.chat/apps-engine/definition/uikit';
import {ISubscription, ITeamSubscriptions} from '../definition';
import {getInteractionRoomData,
	storeInteractionRoomData,} from '../storage/room';

export async function eventModal({modify,
	read,
	persistence,
	http,
	slashCommandContext,
	uikitContext,}: {
	modify: IModify;
	read: IRead;
	persistence: IPersistence;
	http: IHttp;
	slashCommandContext?: SlashCommandContext;
	uikitContext?: UIKitInteractionContext;
}): Promise<IUIKitModalViewParam> {
	const viewId = 'choose_events';
	const block = modify.getCreator().getBlockBuilder();
	const room
        = slashCommandContext?.getRoom()
        || uikitContext?.getInteractionData().room;
	const user
        = slashCommandContext?.getSender()
        || uikitContext?.getInteractionData().user;

	if (user?.id) {
		let roomId;

		if (room?.id) {
			roomId = room.id;
			await storeInteractionRoomData(persistence, user.id, roomId);
		} else {
			roomId = (
				await getInteractionRoomData(
					read.getPersistenceReader(),
					user.id,
				)
			).roomId;
		}

		// Shows indentations in input blocks but not inn section block
		// block.addInputBlock({
		//     blockId: '',
		//     label: {
		//         text: 'ModalsEnum.REPO_NAME_LABEL',
		//         type: TextObjectType.PLAINTEXT,
		//     },
		//     element: block.newPlainTextInputElement({
		//         actionId: 'ModalsEnum.REPO_NAME_INPUT_ACTION',
		//         placeholder: {
		//             text: 'ModalsEnum.REPO_NAME_PLACEHOLDER',
		//             type: TextObjectType.PLAINTEXT,
		//         },
		//     }),
		// });

		const newMultiStaticElement = block.newMultiStaticElement({
			actionId: 'events',
			options: [
				{
					value: 'FILE_COMMENT',
					text: {
						type: TextObjectType.PLAINTEXT,
						text: 'New Comments',
						emoji: true
					}
				},
				{
					value: 'FILE_UPDATE',
					text: {
						type: TextObjectType.PLAINTEXT,
						text: 'File Updates',
						emoji: true
					}
				},
				{
					value: 'FILE_VERSION_UPDATE',
					text: {
						type: TextObjectType.PLAINTEXT,
						text: 'File Version Updates',
						emoji: true
					}
				},
				{
					value: 'FILE_DELETE',
					text: {
						type: TextObjectType.PLAINTEXT,
						text: 'File Delete',
						emoji: true
					}
				},
				{
					value: 'LIBRARY_PUBLISH',
					text: {
						type: TextObjectType.PLAINTEXT,
						text: 'Library Publish',
						emoji: true
					}
				},
			],
			placeholder: {
				type: TextObjectType.PLAINTEXT,
				text: 'Select Events'
			}
		});

		block.addInputBlock({
			label: {
				text: 'Select the Events you want to subscribe to',
				type: TextObjectType.PLAINTEXT,
			},
			element: newMultiStaticElement,
			blockId: 'selectedEvents',
		});
	}

	block.addDividerBlock();

	return {
		id: viewId,
		title: {
			type: TextObjectType.PLAINTEXT, text: 'Choose Events'
		},
		close: block.newButtonElement({
			text: {
				type: TextObjectType.PLAINTEXT, text: 'Close'
			},
		}),
		submit: block.newButtonElement({
			actionId: 'add-subscription',
			text: {
				type: TextObjectType.PLAINTEXT, text: 'Subscribe'
			},
		}),
		blocks: block.getBlocks(),
	};
}
