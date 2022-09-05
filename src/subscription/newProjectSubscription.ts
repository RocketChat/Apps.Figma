import { IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { Subscription } from '../sdk/webhooks.sdk';

export async function newProjectSubscription(
	event,
	read: IRead,
	persistence: IPersistence,
	room,
	useSentEvent,
	project_Ids,
	accessToken,
	team_id,
	user,
	response,
) {
	let projects_to_be_stored: string[] | undefined;
	let files_to_be_stored: string[] | undefined;

	const subscriptionStorage = new Subscription(
		persistence,
		read.getPersistenceReader(),
	);

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
				console.log('response from figma while storing all the projects into db - ', response.status);
				// we got the response of all the files from figma now we will have to store them inside file_Ids array in room data
				// we need this in order to identify if a user subscribed to a particular project does the figma event file is in that project or not.
				files_to_be_stored = response.data.files.map((file) => file.id);
				console.log('project storing files - ', files_to_be_stored, ' - for event - ', event);
				return await subscriptionStorage.storeSubscriptionByEvent(
					'subscription',
					response.data.id,
					team_id,
					room,
					user,
					event,
					projects_to_be_stored, // projects
					files_to_be_stored, // storing files along with projects
				);

			}).catch((e) => {
				console.log('error from project subscriptions - ', e);
				return;
			});
		}));
		return;
	} else {
		console.log('files will not be stored for ', event,' - in project subscription');
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
