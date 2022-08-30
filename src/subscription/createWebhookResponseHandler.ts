import { newFileSubscription } from './newFileSubscription';
import { newTeamSubscription } from './newTeamSubscription';
import { newProjectSubscription } from './newProjectSubscription';

export async function createWebhookResponseHandler(
	response,
	project_Ids,
	file_Ids,
	room,
	accessToken,
	team_id,
	subscriptionStorage,
	user,
	event_type)
{
	if (response.data.error) {
		throw new Error(response.data.error,);
	} else {
		let projects_to_be_stored: string[] | undefined; // we need to store projects + files + room id in db subscribed by particular room
		let files_to_be_stored: string[] | undefined;
		// todo: if subscription is for team add all the projects ( will check project ids for that )

		// for team subscription we need to store only room id and all the files in that room.
		if (project_Ids!.length === 0 && file_Ids!.length === 0) {
			return newTeamSubscription(room, accessToken, team_id, subscriptionStorage, user);
		} else if (project_Ids!.length > 0 || file_Ids!.length === 0) {
			event_type.forEach(async useSentEvent => { // for each event we will look if user passed the same event and then store files and projects
				if (project_Ids!.length > 0) {
					return newProjectSubscription(event, room, useSentEvent, project_Ids, accessToken, subscriptionStorage, team_id, user, response);
				} else if (file_Ids!.length > 0) {
					return newFileSubscription(useSentEvent, file_Ids, response, team_id, user, subscriptionStorage, room);
				} else {
					console.log('not valid');
				}
			});
		} else if (project_Ids!.length === 0) {
			//
		}
	}
}
