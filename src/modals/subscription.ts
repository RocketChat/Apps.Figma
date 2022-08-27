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

export async function subscriptionsModal({modify,
	read,
	persistence,
	http,
	SlashCommandContext,}: {
	modify: IModify;
	read: IRead;
	persistence: IPersistence;
	http: IHttp;
	SlashCommandContext?: SlashCommandContext;
}): Promise<IUIKitModalViewParam> {
	const block = modify.getCreator().getBlockBuilder();
	const room = SlashCommandContext?.getRoom();
	const user = SlashCommandContext?.getSender();

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
	}

	block.addSectionBlock({
		text: {
			text: 'Subscribe your Rocket Chat channel to notifications about files, teams, or projects. You can only subscribe to resources were you have edit access.',
			type: TextObjectType.PLAINTEXT,
		},
	});

	block.addDividerBlock();
	block.addSectionBlock({
		text: {
			text: 'Select a resource to subscribe to',
			type: TextObjectType.PLAINTEXT,
		},
	});

	block.addActionsBlock({
		blockId: 'resource_type',
		elements: [
			block.newStaticSelectElement({
				placeholder: block.newPlainTextObject('File'),
				actionId: 'type',
				initialValue: 'team',
				options: [
					{
						text: block.newPlainTextObject('File'), value: 'file'
					},
					{
						text: block.newPlainTextObject('Team'), value: 'team'
					},
					{
						text: block.newPlainTextObject('Project'),
						value: 'project',
					},
				],
			}),
		],
	});
	block.addInputBlock({
		label: {
			text: 'Enter URL of the team or file',
			type: TextObjectType.PLAINTEXT,
		},
		blockId: 'team_url',
		element: {
			actionId: 'url',
			placeholder: {
				text: 'Enter the URL',
				type: TextObjectType.PLAINTEXT,
			},
			type: BlockElementType.PLAIN_TEXT_INPUT,
		},
	});

	return {
		id: 'subscriptionView',
		title: block.newPlainTextObject('Get Figma Notifications'),
		close: block.newButtonElement({
			text: {
				type: TextObjectType.PLAINTEXT, text: 'Close'
			},
		}),
		submit: block.newButtonElement({
			actionId: 'firstModal',
			text: {
				type: TextObjectType.PLAINTEXT, text: 'Next'
			},
		}),

		blocks: block.getBlocks(),
	};
}
