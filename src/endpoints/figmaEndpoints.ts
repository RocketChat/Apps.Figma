import { ApiEndpoint } from '@rocket.chat/apps-engine/definition/api';
import {
    IRead,
    IHttp,
    IModify,
    IPersistence
} from '@rocket.chat/apps-engine/definition/accessors';
import {
    IApiEndpointInfo,
    IApiRequest,
    IApiResponse
} from '@rocket.chat/apps-engine/definition/api';
import { Subscription } from '../sdk/webhooks.sdk';
import {
    ICommentPayload,
    IDeletePayload,
    ISubscription,
    IVersionUpdatePayload
} from '../definition';
import { events } from '../enums/enums';
import {
    commentEvent,
    deleteEvent,
    updateEvent,
    versionUpdateEvent
} from './events';

export class figmaWebHooks extends ApiEndpoint {
    public path = 'figmawebhook';

    // This method is called when the endpoint is called
    public async post(
        request: IApiRequest,
        endpoint: IApiEndpointInfo,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<IApiResponse> {
        let payload: any;
        // If the event is a push event, the payload is a json object else it is a string
        if (
            request.headers['content-type'] ===
            'application/x-www-form-urlencoded'
        ) {
            payload = JSON.parse(request.content.payload);
        } else {
            payload = request.content;
        }

        if (payload.event_type === events.PING) {
            // todo : send message to the user that a new connection was made successfully
            return this.success();
        }

        const subscription = new Subscription(
            persis,
            read.getPersistenceReader()
        );

        const subscriptions: ISubscription[] =
            await subscription.getSubscriptionsByHookID(payload.webhook_id);
        // todo : handle if there are multiple webhooks for a single file
        if (!subscriptions || subscriptions.length == 0) {
            return this.success();
        }
        const eventCaps = payload.event_type.toUpperCase();
        console.log('event - ', eventCaps);
        switch (eventCaps) {
            case events.COMMENT:
                await commentEvent(
                    payload as ICommentPayload,
                    subscriptions,
                    modify,
                    read,
                    http,
                    persis
                );
                break;

            case events.DELETE:
                await deleteEvent(
                    payload as IDeletePayload,
                    subscriptions,
                    modify,
                    read,
                    http
                );
                break;
            case events.UPDATE:
                await updateEvent(payload, subscriptions, modify, read, http);
                break;
            case events.LIBRARY_PUBLISHED:
                break;
            case events.VERSION_UPDATE:
                await versionUpdateEvent(
                    payload as IVersionUpdatePayload,
                    subscriptions,
                    modify,
                    read,
                    http
                );
                break;
            default:
                return this.success();
        }
        return this.success();
    }
}
