import {ISlashCommand,
	SlashCommandContext} from '@rocket.chat/apps-engine/definition/slashcommands';
import { FigmaApp } from '../FigmaApp';
import {IRead,
	IModify,
	IHttp,
	IPersistence} from '@rocket.chat/apps-engine/definition/accessors';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { createSectionBlock, IButton } from '../src/lib/block';
import {sendDMToUser,
	sendMessage,
	botNotifyCurrentUser} from '../src/lib/messages';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { getAccessTokenForUser } from '../src/storage/users';
import {BlockElementType,
	TextObjectType} from '@rocket.chat/apps-engine/definition/uikit';
import { figmaSubscribeCommand } from './Subscribe';
import { figmaConnectCommand } from './Connect';
import { figmaSubscribedCommand } from './Subscriptions';

export class FigmaCommand implements ISlashCommand {
	public command = 'figma';
	public i18nParamsExample = 'params_example';
	public i18nDescription = 'cmd_description';
	public providesPreview = false;

	public constructor(private readonly app: FigmaApp) {}

	public async executor(
		context: SlashCommandContext,
		read: IRead,
		modify: IModify,
		http: IHttp,
		persistence: IPersistence
	): Promise<void> {
		const [command] = context.getArguments();
		switch (command) {
		case 'connect':
			await figmaConnectCommand(
				this.app,
				read,
				modify,
				context.getSender(),
				persistence
			);
			break;
		case 'help':
			await this.figmaHelpCommand(
				read,
				modify,
				context.getSender(),
				persistence
			);
			break;
		case 'subscribe':
			await figmaSubscribeCommand(
				context,
				read,
				modify,
				http,
				persistence,
				context.getRoom(),
				context.getSender()
			);

			break;
		case 'subscriptions':
			await figmaSubscribedCommand(
				context,
				read,
				modify,
				http,
				persistence,
				context.getRoom(),
				context.getSender()
			);
			break;
		default:
			await this.figmaConfuseCommand(
				context.getRoom(),
				read,
				modify,
				context.getSender(),
				persistence
			);
			break;
		}
	}

	public async figmaHelpCommand(
		read: IRead,
		modify: IModify,
		user: IUser,
		persistence: IPersistence
	) {
		const message = `Commands available inside a channel:
        \xa0\xa0• To connect your Figma account with the rocket chat server use command \`/figma connect\`.
        \xa0\xa0• To subscribe for updates to a any file/project from figma inside rocket chat use command \`/figma subscribe\`.
        \xa0\xa0 • To unsubscribe to a file inside a channel use \`/figma unsubscribe\`.

          Commands available inside Direct Messages:
        \xa0\xa0• \` /figma off \` to turn off notifications.
        \xa0\xa0• \` /figma on \` to turn notifications back on.
         `;
		await sendDMToUser(read, modify, user, message, persistence);
	}
	public async figmaConfuseCommand(
		room: IRoom,
		read: IRead,
		modify: IModify,
		user: IUser,
		persistence: IPersistence
	) {
		const message = `Hmmm. I didn't really understand that last message.
         Try \`/figma help\` to see the commands available
         `;
		await botNotifyCurrentUser(read, modify, user, room, message);
	}
}
