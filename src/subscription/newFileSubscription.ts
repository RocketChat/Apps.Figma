import { IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { Subscription } from '../sdk/webhooks.sdk';

export async function newFileSubscription(
	read: IRead,
	persistence: IPersistence,
	useSentEvent: string[],
	file_Ids,
	response,
	team_id,
	user: IUser,
	room: IRoom,
	event
) {
	let projects_to_be_stored: string[] | undefined;
	let files_to_be_stored: string[] | undefined;

	const subscriptionStorage = new Subscription(
		persistence,
		read.getPersistenceReader(),
	);
	if (useSentEvent.includes(event)) {
		files_to_be_stored = file_Ids;
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
