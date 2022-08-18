import { ApiEndpoint } from '@rocket.chat/apps-engine/definition/api';
import {
    IRead,
    IHttp,
    IModify,
    IPersistence,
} from '@rocket.chat/apps-engine/definition/accessors';
import {
    IApiEndpointInfo,
    IApiEndpoint,
    IApiRequest,
    IApiResponse,
} from '@rocket.chat/apps-engine/definition/api';
import { Subscription } from '../sdk/webhooks.sdk';
import { ISubscription } from '../definition';
import { sendNotificationToUsers } from '../lib/messages';
export class figmaWebHooks extends ApiEndpoint {
    public path = 'figmawebhook';

    // this method is called when the endpoint is called
    public async post(
        request: IApiRequest,
        endpoint: IApiEndpointInfo,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<IApiResponse> {
        let payload: any;
        // if the event is a push event, the payload is a json object else it is a string
        if (
            request.headers['content-type'] ===
            'application/x-www-form-urlencoded'
        ) {
            payload = JSON.parse(request.content.payload);
        } else {
            payload = request.content;
        }

        if (payload.event_type === 'PING') {
            // if its an ping event then store the subscription inside the storage with all the details
            // let subscriptionStorage = new Subscription(
            //     persis,
            //     read.getPersistenceReader()
            // );
            // const subscriptions: Array<ISubscription> =
            //     await subscriptionStorage.getSubscribedRooms(
            //         payload.webhook_id,
            //     );
            // if (!subscriptions || subscriptions.length == 0) {
            //     return this.success();
            // }

            // const eventCaps = event.toUpperCase();
            // let messageText = "newEvent !";
            return this.success();
        } else {
            console.log('figma webhook event 📦 - ', payload);
            const subscription = new Subscription(
                persis,
                read.getPersistenceReader()
            );
            subscription
                .getSubscriptionsByHookID(
                    payload.webhook_id,
                    payload.event_type
                )
                .then((subscriptions: Array<ISubscription>) => {
                    console.log('subscriptions 🍳 - ', subscriptions);
                    if (subscriptions && subscriptions.length > 0) {
                        subscriptions.forEach((subscription: ISubscription) => {
                            console.log('subscription 📦 - ', subscription);
                            let room = subscription.room;
                            let user = subscription.user;
                            let messageText = 'newEvent !';
                            let message = {
                                msg: messageText,
                                room: room,
                                user: user,
                            };
                            console.log('message 📦 - ', message);
                        });
                    }
                })
                .catch((err) =>
                    console.log('error getting subscriptions - ', err)
                );

            return this.success();
        }
    }
}
