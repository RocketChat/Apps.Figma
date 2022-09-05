import { IHttp } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { Subscription } from '../sdk/webhooks.sdk';
import { getAccessTokenForUser } from '../storage/users';

export async function newTeamSubscription(
	persistence,
	read,
	http: IHttp,
	room: IRoom,
	accessToken,
	team_id,
	event,
	current_event_on_loop,
	user: IUser
) {
	console.log('2');
	let projects_to_be_stored: string[] | undefined;
	let files_to_be_stored: string[] | undefined;

	const subscriptionStorage = new Subscription(
		persistence,
		read.getPersistenceReader(),
	);

	const token = await getAccessTokenForUser(
		read,
		user
	);

	const headers: { Authorization: string } = {
		Authorization: `Bearer ${token?.token}`
	};

	// todo : create a different file for sending request
	try {
		http.get(`https://api.figma.com/v1/teams/${team_id}/projects`, {
			headers: {
				Authorization: `Bearer ${accessToken?.token}`
			}
		}).then(async (response) => {
			projects_to_be_stored = response.data.projects.map(
				(project) => project.id
			);
			// files to be stored

			const reqUrls = response.data.projects.map(
				(projectId) =>
					`https://api.figma.com/v1/projects/${projectId}/files`
			);

			console.log('3 - reqUrls - ', reqUrls);

			try {
				await Promise.all(
					reqUrls.map((url) =>
						this.http.get(url, {
							headers
						})
					)
				).then((responses) => {
					console.log(
						'4 - files response - ',
						responses
					);

					responses.forEach((response) => {
						response.data.files.forEach(
							(file: string) => {
								files_to_be_stored!.push(file);
							}
						);
					});
					console.log('5 -files array - ', files_to_be_stored);
				}).catch((err) => {
					console.log('2 - err getting all files in team subscription - ', err);
				});

			} catch (e) {
				console.log('error - ', e);
			}

			if (event === current_event_on_loop) {
				console.log('6 - user passed event = loop event -> storing - ', projects_to_be_stored, files_to_be_stored);
				return await subscriptionStorage.storeSubscription(
					room,
					user,
					team_id,
					projects_to_be_stored,
					files_to_be_stored,
					event
				);
			} else {
				console.log('2 - user passed event != loop event -> storing - ', projects_to_be_stored, files_to_be_stored, event);
				return await subscriptionStorage.storeSubscriptionByEvent(
					'subscription',
					response.data.id,
					team_id,
					room,
					user,
					event,
					projects_to_be_stored,
					files_to_be_stored
				);}
		}).catch((err) =>
			console.log(
				'error while getting all the projects for this team in the given event - ',
				err
			)
		);

	} catch (error) {
		console.log('error while getting all the projects for this team in the given event - ', error);
	}
}
