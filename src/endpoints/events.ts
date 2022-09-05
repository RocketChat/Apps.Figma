import { IHttp, IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import {  ICommentPayload, IDeletePayload, IUpdatePayload , IVersionUpdatePayload , ILibraryPublishPayload, ISubscription, storedRoomData } from '../definition';
import { sendMessage } from '../lib/messages';
import { getAllUsers } from '../storage/users';
import { commentEvent as useCommentEvent } from './commentEvent';

export async function commentEvent(
	payload:  ICommentPayload,
	subscriptions: ISubscription[],
	modify: IModify,
	read: IRead,
	http: IHttp
)  {
	let comment = ''; // todo : fix the comment text
	// it contains an array of 3 then the first element is the text and the second is the mention and the third is the text after mention
	if (payload.comment.length == 3) {
		// someone is mentioned in the comment get the person and match that id with user id form getAllUsers and ping him
		await getAllUsers(read).then((users) => {
			const user = users.find((user) => user.id === payload.mentions[0].id);
			console.log('users - ', users);
			//todo: handle for multiple mentions
			if (user) {
				comment =  payload.comment[0].text + ' @' + payload.comment[1].mention + ' ' + payload.comment[2].text;
			} else {
				comment = payload.comment[0].text;
			}
		}).catch(e => console.log('error finding user in db mentioned in comment - ', e));
	} else {
		comment = payload.comment[0].text;
	}
	// now send a message with comment as quote to all the subscribed users
	for (const subscription of subscriptions) {
		for (const roomData of subscription.room_data) {
			const room = await read
				.getRoomReader()
				.getById(roomData.room_Id!);

			const user = await read
				.getUserReader()
				.getById(subscription.user_id);
			// split this into multiple files
			await useCommentEvent(room, roomData, user, payload, modify, comment);
		}
	}
}
export async function deleteEvent(
	payload: ICommentPayload,
	subscriptions: ISubscription[],
	modify: IModify,
	read: IRead,
	http: IHttp
) {
	//
}
export async function updateEvent(
	payload: ICommentPayload,
	subscriptions: ISubscription[],
	modify: IModify,
	read: IRead,
	http: IHttp
) {
	//
}
export async function publishEvent(
	payload: ICommentPayload,
	subscriptions: ISubscription[],
	modify: IModify,
	read: IRead,
	http: IHttp
) {
	//
}
export async function versionUpdateEvent(
	payload: ICommentPayload,
	subscriptions: ISubscription[],
	modify: IModify,
	read: IRead,
	http: IHttp
) {
	//
}
