import {
    IHttp,
    IHttpRequest,
    IModify,
    IPersistence,
    IRead
} from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import {
    TextObjectType,
    UIKitViewSubmitInteractionContext
} from '@rocket.chat/apps-engine/definition/uikit';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { file } from '../../definition';
import { getRequest } from '../../helpers/Figma.sdk';
import { getProjectFilesUrl } from '../../lib/const';
import { botMessageChannel } from '../../lib/messages';
import { Subscription } from '../../sdk/webhooks.sdk';
import { getAccessTokenForUser } from '../../storage/users';

export async function newProjectSubscription(
    context: UIKitViewSubmitInteractionContext,
    event: string,
    http: IHttp,
    read: IRead,
    persistence: IPersistence,
    room: IRoom,
    useSentEvent: string[],
    project_Ids: string[],
    team_id: string,
    user: IUser,
    response: IHttpRequest
) {
   // 2 - creating a new projects subscription
    let projects_to_be_stored: string[] | undefined;
    let files_to_be_stored: string[] | undefined;

    const subscriptionStorage = new Subscription(
        persistence,
        read.getPersistenceReader()
    );
    if (useSentEvent.includes(event)) {
        // if the event in array of user passed events matches with loop event then it will be stored with files else empty file array
        files_to_be_stored = [];
        projects_to_be_stored = project_Ids;
        await Promise.all(
            project_Ids.map(async (project_id) => {
                // this will run for all project ids for all these store them in one file
                const projecturl=getProjectFilesUrl(project_id);
                await getRequest(
                    read,
                    context,
                    http,
                    projecturl
                )
                    .then(async (response) => {
                        // 3 - got the files from figma
                        const tempArr = response.data.files.map(
                            (file: file) => file.key
                        );
                        tempArr.forEach((element) => {
                            files_to_be_stored?.push(element);
                        });
                    })
                    .catch(async () => {
                        const block = this.modify
                            .getCreator()
                            .getBlockBuilder();
                        block.addSectionBlock({
                            text: {
                                text: 'Error in fetching Files for the subscribed projects. Please Report this issue',
                                type: TextObjectType.PLAINTEXT
                            }
                        });
                        return await botMessageChannel(
                            this.read,
                            this.modify,
                            room,
                            block
                        );
                    });
            })
        );
        await subscriptionStorage.storeSubscriptionByEvent(
            'subscription',
            response.data.id,
            team_id,
            room,
            user,
            event,
            projects_to_be_stored, // projects
            files_to_be_stored // storing files along with projects which will be helpful while sending messages for pings from files check webhookSDK
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
