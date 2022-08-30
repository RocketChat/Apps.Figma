import {IHttp,
	ILogger,
	IModify,
	IPersistence,
	IRead,} from '@rocket.chat/apps-engine/definition/accessors';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import {  UIKitInteractionContext} from '@rocket.chat/apps-engine/definition/uikit';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { blockAction } from '../enums/enums';
import { IUIKitResponse } from '@rocket.chat/apps-engine/definition/uikit';
import { UIKitBlockInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { getFiles } from '../lib/getFiles';
import { getInteractionRoomData } from '../storage/room';

export class BlockActionHandler {
	constructor(
        private readonly app: IApp,
        private readonly read: IRead,
        private readonly http: IHttp,
        private readonly modify: IModify,
        private readonly persistence: IPersistence
	) {}

	public async run(
		context: UIKitBlockInteractionContext,
		read: IRead,
		http: IHttp,
		persistence: IPersistence,
		modify: IModify,
		//slashcommandcontext?: SlashCommandContext,
		uikitcontext?: UIKitInteractionContext
	): Promise<IUIKitResponse> {

		const data = context.getInteractionData();
		const { actionId, user } = data;

		const roomFromStorage = await getInteractionRoomData(
			read.getPersistenceReader(),
			user.id
		);
		const room = await read
			.getRoomReader()
			.getById(roomFromStorage.roomId!);

		try {
			switch (actionId) {
			case blockAction.FILES:
				console.log('clicked on file');
				await getFiles(context, persistence, read, data, room, http);
				return context.getInteractionResponder().successResponse();
			case blockAction.PROJECTS:
				console.log('clicked on project');
				break;
			case blockAction.TEAMS:
				console.log('clicked on team');
				break;
			default:
				break;
			}
		} catch (error) {
			console.log('error - ', error);
			return context.getInteractionResponder().viewErrorResponse({
				viewId: actionId,
				errors: error,
			});
		}

		return context.getInteractionResponder().successResponse();
	}

}
