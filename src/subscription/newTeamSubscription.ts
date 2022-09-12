/* eslint-disable no-mixed-spaces-and-tabs */
import { IHttp, IHttpResponse, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { Subscription } from '../sdk/webhooks.sdk';
import { getAccessTokenForUser } from '../storage/users';
import { file } from '../definition';
import { botMessageChannel, sendMessage } from '../lib/messages';
import { TextObjectType } from '@rocket.chat/apps-engine/definition/uikit';
export async function newTeamSubscription(
	modify: IModify,
	persistence: IPersistence,
	read: IRead,
	http: IHttp,
	room: IRoom,
	accessToken,
	team_id,
	event: string[],
	current_event_on_loop,
	user: IUser,
	response: IHttpResponse
) {
	console.log('2');
	let projects_to_be_stored: string[];
	let files_to_be_stored: string[];

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
		}).then(async (team_response) => {
			if (event.includes(current_event_on_loop)) {
				projects_to_be_stored = team_response.data.projects.map(
					(project: any) => project.id
				);
				files_to_be_stored = [];
				const reqUrls = team_response.data.projects.map((project) => `https://api.figma.com/v1/projects/${project.id}/files`);
				try {
					await Promise.all(
						reqUrls.map((url) => http.get(url, {
							headers
						})))
						.then((project_response) => {
							project_response.forEach((response) => response.data.files.forEach((file: file) => files_to_be_stored.push(file.key)));
						})
						.catch(async () => {

							const block = this.modify.getCreator().getBlockBuilder();
							block.addSectionBlock({
								text: {
									text: 'Error in fetching Files. Please Report this issue',
									type: TextObjectType.PLAINTEXT,
								},
							});
							return await botMessageChannel(this.read, this.modify, room, block);
						});

				} catch (e) {

					const block = this.modify.getCreator().getBlockBuilder();
					block.addSectionBlock({
						text: {
							text: 'Error in fetching Files. Please Report this issue',
							type: TextObjectType.PLAINTEXT,
						},
					});
					return await botMessageChannel(this.read, this.modify, room, block);
				}
				 return await subscriptionStorage.storeSubscriptionByEvent(
					'subscription',
				 	response.data.id,
				 	team_id,
				 	room,
				 	user,
				 	current_event_on_loop,
				 	projects_to_be_stored,
				 	files_to_be_stored
				 );
			} else {
				 return await subscriptionStorage.storeSubscriptionByEvent(
				 	'subscription',
				 	response.data.id,
				 	team_id,
				 	room,
				 	user,
				 	current_event_on_loop,
				 	projects_to_be_stored,
				 	files_to_be_stored
				 );
			}
		}).catch(async () => {

			const block = this.modify.getCreator().getBlockBuilder();
			block.addSectionBlock({
				text: {
					text: 'Error in fetching Projects. Please Report this issue',
					type: TextObjectType.PLAINTEXT,
				},
			});
			return await botMessageChannel(this.read, this.modify, room, block);

		});
	} catch (error) {

		const block = this.modify.getCreator().getBlockBuilder();
		block.addSectionBlock({
			text: {
				text: 'Error in fetching Projects. Please Report this issue',
				type: TextObjectType.PLAINTEXT,
			},
		});
		return await botMessageChannel(this.read, this.modify, room, block);
    }
	return;
}
