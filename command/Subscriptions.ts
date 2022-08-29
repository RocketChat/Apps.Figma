import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import {  IRead,  IModify, IHttp, IPersistence} from '@rocket.chat/apps-engine/definition/accessors';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { sendDMToUser, sendMessage, sendNotificationToUsers } from '../src/lib/messages';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { TextObjectType } from '@rocket.chat/apps-engine/definition/uikit';
import { IButton } from '../src/lib/block';
import { createSectionBlock } from '../src/lib/block';

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
	const buttonGroup: IButton[] = [
		{
			text: 'Files',
			actionId: 'getFiles'
		},
		{
			text: 'Projects',
			actionId: 'getProjects'
		},
		{
			text: 'Teams',
			actionId: 'getTeams'
		}
	];

	const block = modify.getCreator().getBlockBuilder();
	block.addSectionBlock({
		text: {
			type: TextObjectType.PLAINTEXT,
			text: 'Select a category to view'
		},
	});

	block.newButtonElement({
		text: {
			type: TextObjectType.PLAINTEXT,
			text: 'File'
		},
		actionId: 'getFiles'
	});

	block.newButtonElement({
		text: {
			type: TextObjectType.PLAINTEXT,
			text: 'Projects'
		},
		actionId: 'getProjects'
	});

	block.newButtonElement({
		text: {
			type: TextObjectType.PLAINTEXT,
			text: 'Teams'
		},
		actionId: 'getTeams'
	});

	// blocks are created send a message to the user now
	const msg = modify
		.getCreator()
		.startMessage()
		.setSender(sender)
		.setRoom(room)
		.setGroupable(false)
		.setParseUrls(false);
	msg.setBlocks(block);

	await modify.getCreator().finish(msg);
}
