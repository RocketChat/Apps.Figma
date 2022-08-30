import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import {  IRead,  IModify, IHttp, IPersistence} from '@rocket.chat/apps-engine/definition/accessors';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { sendDMToUser, sendMessage, sendNotificationToUsers } from '../src/lib/messages';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { TextObjectType } from '@rocket.chat/apps-engine/definition/uikit';
import { IButton } from '../src/lib/block';
import { createSectionBlock } from '../src/lib/block';
import { blockAction } from '../src/enums/enums';

export async function figmaSubscribedCommand(
	context: SlashCommandContext,
	read: IRead,
	modify: IModify,
	http: IHttp,
	persistence: IPersistence,
	room: IRoom,
	sender: IUser,
	id?: string
) {
	// todo: use createSectionBlock to create a block with a button group for now this is temporary
	const builder = await modify.getCreator().startMessage().setRoom(room);
	const block = modify.getCreator().getBlockBuilder();

	block.addSectionBlock({
		text: {
			type: TextObjectType.PLAINTEXT,
			text: 'Select a category to view'
		},
	});

	block.addActionsBlock({
		blockId: blockAction.SUBSCRIPTIONS,
		elements: [
			block.newButtonElement({
				actionId: blockAction.FILES,
				text: block.newPlainTextObject('Files'),
				value: 'files',
			}),
			block.newButtonElement({
				actionId: blockAction.PROJECTS,
				text: block.newPlainTextObject('Projects'),
				value: 'projects',
			}),
			block.newButtonElement({
				actionId: blockAction.TEAMS,
				text: block.newPlainTextObject('Team'),
				value: 'team',
			}),
		],
	});
	builder.setBlocks(block);

	await modify
		.getNotifier()
		.notifyUser(sender, builder.getMessage());
}
