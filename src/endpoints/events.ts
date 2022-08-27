import { IHttp, IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import {  ICommentPayload, IDeletePayload, IUpdatePayload , IVersionUpdatePayload , ILibraryPublishPayload, ISubscription } from '../definition';
import { sendMessage } from '../lib/messages';

export async function commentEvent(
	payload:  ICommentPayload,
	subscriptions: ISubscription[],
	modify: IModify,
	read: IRead,
	http: IHttp
)  {
	let comment: string; // todo : fix the comment text
	// it contains an array of 3 then the first element is the text and the second is the mention and the third is the text after mention
	if (payload.comment.length == 3) {
		comment = payload.comment[0].text + ' ' + payload.comment[1].mention + ' ' + payload.comment[2].text;
	} else {
		comment = payload.comment[0].text;
    }
    // now send a message with comment as quote to all the subscribed users
    
	console.log('[6] these subscriptions found with the matching hook id - ',subscriptions);
	for (const subscription of subscriptions) {
		for (const roomData of subscription.room_data) {
			const room = await read
				.getRoomReader()
				.getById(roomData.room_id!);

			const user = await read
				.getUserReader()
				.getById(subscription.user_id);

			if (room) {
				await sendMessage(modify, room, user, messageText);
			} else {
				console.log(
					'[5] - Figma pinged but room not found - ',
					roomData,
				);
			}
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
	const messageText = `${payload.triggered_by.handle} commented '${payload.comment[0].text}' on file - ${payload.file_name}`;// todo : fix the comment text
	console.log('[6] these subscriptions found with the matching hook id - ',subscriptions);
	for (const subscription of subscriptions) {
		for (const roomData of subscription.room_data) {
			const room = await read
				.getRoomReader()
				.getById(roomData.room_id!);

			const user = await read
				.getUserReader()
				.getById(subscription.user_id);

			if (room) {
				await sendMessage(modify, room, user, messageText);
			} else {
				console.log(
					'[5] - Figma pinged but room not found - ',
					roomData,
				);
			}
		}
	}
}
export async function updateEvent(
	payload: ICommentPayload,
	subscriptions: ISubscription[],
	modify: IModify,
	read: IRead,
	http: IHttp
) {
	const messageText = `${payload.triggered_by.handle} commented '${payload.comment[0].text}' on file - ${payload.file_name}`;// todo : fix the comment text
	console.log('[6] these subscriptions found with the matching hook id - ',subscriptions);
	for (const subscription of subscriptions) {
		for (const roomData of subscription.room_data) {
			const room = await read
				.getRoomReader()
				.getById(roomData.room_id!);

			const user = await read
				.getUserReader()
				.getById(subscription.user_id);

			if (room) {
				await sendMessage(modify, room, user, messageText);
			} else {
				console.log('[5] - Figma pinged but room not found - ', roomData);
			}
		}
	}
}
export async function publishEvent(
	payload: ICommentPayload,
	subscriptions: ISubscription[],
	modify: IModify,
	read: IRead,
	http: IHttp
) {
	const messageText = `${payload.triggered_by.handle} commented '${payload.comment[0].text}' on file - ${payload.file_name}`;// todo : fix the comment text
	console.log('[6] these subscriptions found with the matching hook id - ',subscriptions);
	for (const subscription of subscriptions) {
		for (const roomData of subscription.room_data) {
			const room = await read
				.getRoomReader()
				.getById(roomData.room_id!);

			const user = await read
				.getUserReader()
				.getById(subscription.user_id);

			if (room) {
				await sendMessage(modify, room, user, messageText);
			} else {
				console.log(
					'[5] - Figma pinged but room not found - ',
					roomData,
				);
			}
		}
	}
}
export async function versionUpdateEvent(
	payload: ICommentPayload,
	subscriptions: ISubscription[],
	modify: IModify,
	read: IRead,
	http: IHttp
) {
	const messageText = `${payload.triggered_by.handle} commented '${payload.comment[0].text}' on file - ${payload.file_name}`;// todo : fix the comment text
	console.log('[6] these subscriptions found with the matching hook id - ',subscriptions);
	for (const subscription of subscriptions) {
		for (const roomData of subscription.room_data) {
			const room = await read
				.getRoomReader()
				.getById(roomData.room_id!);

			const user = await read
				.getUserReader()
				.getById(subscription.user_id);

			if (room) {
				await sendMessage(modify, room, user, messageText);
			} else {
				console.log(
					'[5] - Figma pinged but room not found - ',
					roomData,
				);
			}
		}
	}
}
