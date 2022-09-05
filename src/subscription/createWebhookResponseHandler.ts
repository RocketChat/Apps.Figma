/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { newFileSubscription } from './newFileSubscription';
import { newTeamSubscription } from './newTeamSubscription';
import { newProjectSubscription } from './newProjectSubscription';
import {IHttp,
	IPersistence,
	IRead} from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

export async function createWebhookResponseHandler(
	persistence: IPersistence,
	read: IRead,
	http: IHttp,
	response,
	project_Ids,
	file_Ids,
	room: IRoom,
	accessToken,
	team_id: string,
	user: IUser,
	event_type,
	current_event_on_loop
) {
	if (response.data.error) {
		throw new Error(response.data.error);
	} else {
		// todo: if subscription is for team add all the projects ( will check project ids for that )
		if (!project_Ids && !file_Ids) {
			console.log('1 - creating webhook response for team subscription');
			await newTeamSubscription(
				persistence,
				read,
				http,
				room,
				accessToken,
				team_id,
				event_type,
				current_event_on_loop,
				user
			);
		} else if (project_Ids || file_Ids) {
			event_type.forEach(async (useSentEvent) => {
				if (project_Ids!.length > 0) {
					console.log('for project');
					return await newProjectSubscription(
						current_event_on_loop,
						read,
						persistence,
						room,
						useSentEvent,
						project_Ids,
						accessToken,
						team_id,
						user,
						response
					);
				} else if (file_Ids!.length > 0) {
					console.log('for file');
					return await newFileSubscription(
						read,
						persistence,
						useSentEvent,
						file_Ids,
						response,
						team_id,
						user,
						room,
						current_event_on_loop
					);
				} else {
					console.log('not valid for file and project');
					return;
				}
			});
		}
	}
	return;
}
