import {
    IHttpResponse,
    IPersistence,
    IRead
} from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { events } from '../../enums/enums';
import { Subscription } from '../../sdk/webhooks.sdk';

export async function newFileSubscription(
    read: IRead,
    persistence: IPersistence,
    useSentEvent: string[],
    file_Ids: string[],
    response: IHttpResponse,
    team_id: string,
    user: IUser,
    room: IRoom,
    event: events
) {
    console.log('2 - inside new files subscription');
    let projects_to_be_stored: string[] | undefined;
    let files_to_be_stored: string[] | undefined;

    const subscriptionStorage = new Subscription(
        persistence,
        read.getPersistenceReader()
    );
    if (useSentEvent.includes(event)) {
        console.log(
            '3, 4 - for files there are not much complicated steps ( this step should occur exactly 5 times )'
        );
        files_to_be_stored = file_Ids;
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
    } else {
        console.log(
            '3, 4 - for files there are not much complicated steps ( this step should occur exactly 5 times )'
        );

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
}
