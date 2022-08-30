// create a function called as newProjectSubscription
import {IHttp,
	IMessageBuilder,
	IModify,
	IModifyCreator,
	IPersistence,
	IRead} from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import {IUIKitResponse,
	TextObjectType,
	UIKitViewSubmitInteractionContext,
	ButtonStyle,
	UIKitInteractionContext} from '@rocket.chat/apps-engine/definition/uikit';
import {ISlashCommand,
	SlashCommandContext} from '@rocket.chat/apps-engine/definition/slashcommands';
import { IUIKitViewSubmitIncomingInteraction } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionTypes';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { getAccessTokenForUser } from '../storage/users';
import { HttpStatusCode } from '@rocket.chat/apps-engine/definition/accessors';
import { Subscription } from '../sdk/webhooks.sdk';
import { storedRoomData } from '../definition';

export async function newProjectSubscription(
	event,
	room,
	useSentEvent,
	project_Ids,
	accessToken,
	subscriptionStorage,
	team_id,
	user,
	response,
) {
	let projects_to_be_stored: string[] | undefined;
	let files_to_be_stored: string[] | undefined;
	if (useSentEvent === event) {
		projects_to_be_stored = project_Ids;
		await Promise.all(project_Ids!.map(async (project_id) => {
			await this.http.get(
				`https://api.figma.com/v1/projects/${project_id}/files`,
				{
					headers: {
						Authorization: `Bearer ${accessToken?.token}`
					}
				},
			).then(async response => {
				console.log('response from figma while storing all the projects into db - ', response);
				// we got the response of all the files from figma now we will have to store them inside file_Ids array in room data
				// we need this in order to identify if a user subscribed to a particular project does the figma event file is in that project or not.
				files_to_be_stored = response.data.files.map((file) => file.id);
				return await subscriptionStorage.storeSubscriptionByEvent(
					'subscription',
					response.data.id,
					team_id,
					room,
					user,
					event,
					projects_to_be_stored,
					files_to_be_stored,
				);

			});
		}));
	} else {
		return await subscriptionStorage.storeSubscriptionByEvent(
			'subscription',
			response.data.id,
			team_id,
			room,
			user,
			event,
			projects_to_be_stored,
			files_to_be_stored,
		);
	}


}
