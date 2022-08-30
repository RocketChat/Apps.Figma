import {ApiEndpoint} from '@rocket.chat/apps-engine/definition/api';
import {IRead, IHttp, IModify, IPersistence} from '@rocket.chat/apps-engine/definition/accessors';
import {IApiEndpointInfo, IApiRequest, IApiResponse} from '@rocket.chat/apps-engine/definition/api';
import {Subscription} from '../sdk/webhooks.sdk';
import {ICommentPayload, IDeletePayload, ILibraryPublishPayload, ISubscription, IUpdatePayload, IVersionUpdatePayload} from '../definition';
import { sendMessage, sendNotificationToUsers } from '../lib/messages';
import { getAllUsers } from '../storage/users';
import { events } from '../enums/enums';
import { commentEvent, deleteEvent } from './events';

export class figmaWebHooks extends ApiEndpoint {
	public path = 'figmawebhook';

	// This method is called when the endpoint is called
	public async post(
		request: IApiRequest,
		endpoint: IApiEndpointInfo,
		read: IRead,
		modify: IModify,
		http: IHttp,
		persis: IPersistence,
	): Promise<IApiResponse>{
		let payload: any;
		// If the event is a push event, the payload is a json object else it is a string
		if (
			request.headers['content-type']
            === 'application/x-www-form-urlencoded'
		) {
			payload = JSON.parse(request.content.payload);
		} else {
			payload = request.content;
		}

		if (payload.event_type === events.PING) {
			console.log('[4] PING from figma - ', payload);
			// todo : send message to the user that a new connection was made successfully
			return this.success();
		}

		const subscription = new Subscription(
			persis,
			read.getPersistenceReader(),
		);

		// Search subscriptions by webhook id in the stored subscriptions
		const subscriptions: ISubscription[]
            = await subscription.getSubscriptionsByHookID(payload.webhook_id);
		if (!subscriptions || subscriptions.length == 0) {
			console.log('[5] - Figma Pinged but No subscriptions found - ', payload);
			return this.success();
		}
		console.log('Figma pinged and matching Subscriptions found - ', subscriptions); // there should be only one subscription with one hook id

		const eventCaps = payload.event_type.toUpperCase();

		// switch case statement for event types
		switch (eventCaps) {
		case events.COMMENT:
			await commentEvent(payload as ICommentPayload, subscriptions, modify, read, http);
			break;

		// case events.DELETE:
		// 	// send message to the rooms for the delete event
		// 	break;
		// case events.UPDATE:
		// 	// send message to the rooms for the update event
		// 	break;
		// case events.LIBRARY_PUBLISHED:
		// 	// send message to the rooms for the create event
		// 	break;
		// case events.VERSION_UPDATE:
		// 	// send message to the rooms for the version update event
		// 	break;
		default:
			// send message to the rooms for error
			return this.success();
		}
		return this.success();
	}
}
