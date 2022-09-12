/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { newFileSubscription } from './newFileSubscription';
import { newTeamSubscription } from './newTeamSubscription';
import { newProjectSubscription } from './newProjectSubscription';
import {IHttp,
	IHttpResponse,
	IModify,
	IPersistence,
	IRead} from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { IAuthData } from '@rocket.chat/apps-engine/definition/oauth2/IOAuth2';
import { botMessageChannel, sendMessage } from '../lib/messages';
import { TextObjectType } from '@rocket.chat/apps-engine/definition/uikit';

export async function createWebhookResponseHandler(
	modify: IModify,
	persistence: IPersistence,
	read: IRead,
	http: IHttp,
	response: IHttpResponse,
	project_Ids: string[] | undefined,
	file_Ids: string[] | undefined,
	room: IRoom,
	accessToken: IAuthData,
	team_id: string,
	user: IUser,
	event_type: string[],
	current_event_on_loop: string,
) {
	if (response.data.error) {
		throw new Error(response.data.error);
	} else {
		// todo: if subscription is for team add all the projects ( will check project ids for that )
		if (!project_Ids && !file_Ids) {
			await newTeamSubscription(
				modify,
				persistence,
				read,
				http,
				room,
				accessToken,
				team_id,
				event_type,
				current_event_on_loop,
				user,
				response
			);
		} else if (project_Ids || file_Ids) {
			if (project_Ids && project_Ids?.length > 0) {
				return await newProjectSubscription(
					current_event_on_loop,
					http,
					read,
					modify,
					persistence,
					room,
					event_type,
					project_Ids,
					accessToken,
					team_id,
					user,
					response
				);
			} else if ( file_Ids && file_Ids?.length > 0) {
				return await newFileSubscription(
					read,
					persistence,
					event_type,
					file_Ids,
					response,
					team_id,
					user,
					room,
					current_event_on_loop
				);
			} else {
				const block = this.modify.getCreator().getBlockBuilder();
				block.addSectionBlock({
					text: {
						text: 'No project or file Ids found',
						type: TextObjectType.PLAINTEXT,
					},
				});
				return await botMessageChannel(this.read, this.modify, room, block);
			}

		}
	}
	return;
}
