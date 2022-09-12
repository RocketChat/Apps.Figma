import { IHttp, IHttpRequest, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IAuthData } from '@rocket.chat/apps-engine/definition/oauth2/IOAuth2';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { TextObjectType } from '@rocket.chat/apps-engine/definition/uikit';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { file } from '../definition';
import { botMessageChannel } from '../lib/messages';
import { Subscription } from '../sdk/webhooks.sdk';

export async function newProjectSubscription(
	event: string,
	http: IHttp,
	read: IRead,
	modify: IModify,
	persistence: IPersistence,
	room: IRoom,
	useSentEvent: string[],
	project_Ids: string[],
	accessToken: IAuthData,
	team_id: string,
	user: IUser,
	response: IHttpRequest,
) {
	let projects_to_be_stored: string[] | undefined;
	let files_to_be_stored: string[] | undefined;

	const subscriptionStorage = new Subscription(
		persistence,
		read.getPersistenceReader(),
	);
	if (useSentEvent.includes(event)) { // if the event in array of user passed events matches with loop event then it will be stored with files else empty file array
		files_to_be_stored = [];
		projects_to_be_stored = project_Ids;
		await Promise.all(project_Ids.map(async (project_id) => { // this will run for all project ids for all these store them in one file
			await http.get(
				`https://api.figma.com/v1/projects/${project_id}/files`,
				{
					headers: {
						Authorization: `Bearer ${accessToken?.token}`
					}
				},
			).then(async response => {
				const tempArr = response.data.files.map((file: file) => file.key);
				tempArr.forEach(element => {
					files_to_be_stored?.push(element);
				});

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
		}));
		await subscriptionStorage.storeSubscriptionByEvent(
			'subscription',
			response.data.id,
			team_id,
			room,
			user,
			event,
			projects_to_be_stored, // projects
			files_to_be_stored // storing files along with projects
		);
		// clear the files_to_be_stored array after storing all projects
		files_to_be_stored = undefined;
		return;
	} else {
		return await subscriptionStorage.storeSubscriptionByEvent(
			'subscription',
			response.data.id,
			team_id,
			room,
			user,
			event,
			projects_to_be_stored,
			files_to_be_stored
		);
	}
	return;
}
