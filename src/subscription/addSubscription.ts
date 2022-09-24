import {
    IHttp,
    IModify,
    IPersistence,
    IRead
} from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import {
    IUIKitModalResponse,
    TextObjectType,
    UIKitViewSubmitInteractionContext
} from '@rocket.chat/apps-engine/definition/uikit';

import { FigmaApp } from '../../FigmaApp';
import { getTeamID, getWebhookUrl } from '../sdk/subscription.sdk';
import { getAccessTokenForUser } from '../storage/users';
import { Subscription } from '../sdk/webhooks.sdk';
import { botMessageChannel, botNotifyCurrentUser } from '../lib/messages';
import { IProjectModalData } from '../definition';
import { events } from '../enums/enums';
import { WebhookSubscription } from '../handlers/subscription/createSubscriptionHandler';
import { updateSubscriptionHandler } from '../handlers/subscription/updateSubscriptionHandler';
import { getRequest, postRequest } from '../helpers/Figma.sdk';

export class AddSubscription {
    constructor(
        private readonly app: FigmaApp,
        private readonly read: IRead,
        private readonly http: IHttp,
        private readonly modify: IModify,
        private readonly persistence: IPersistence
    ) {}

    public async run(
        context: UIKitViewSubmitInteractionContext,
        room: IRoom
    ): Promise<
        | {
              success: boolean;
          }
        | string
        | IUIKitModalResponse
    > {
        const { user, view } = context.getInteractionData();
        const { state }: IProjectModalData = view as any; //todo: fix this
        const event_type = state?.selectedEvents.events;

        const project_Ids: string[] | undefined =
            state?.selectedProjects?.projects;
        const file_Ids: string[] | undefined = state?.selectedFiles?.files;
        const team_id: string | undefined = getTeamID(state?.team_url.url);
        console.log('team id - ', team_id);

        if (
            user.id === undefined ||
            team_id === undefined ||
            event_type === undefined
        ) {
            await botNotifyCurrentUser(
                this.read,
                this.modify,
                user,
                room,
                'Invalid Input !'
            );
            return { success: false };
        }

        try {
            const accessToken = await getAccessTokenForUser(this.read, user);
            if (!accessToken) {
                await botNotifyCurrentUser(
                    this.read,
                    this.modify,
                    user,
                    room,
                    'You are not connect to figma!'
                );
                return { success: false };
            }
            const url = await getWebhookUrl(this.app);
            const subscriptionStorage = new Subscription(
                this.persistence,
                this.read.getPersistenceReader()
            );

            const createWebhookSubscription = new WebhookSubscription(
                this.read,
                this.http,
                this.modify,
                this.persistence
            );

            let count = 0; // this counter we will use if if there are only 4 or less hooks left to create in figma we will notify the use that subscription was unsuccessful and delete some in figma
            subscriptionStorage // todo: fix this .then chain into async await
                .getSubscriptionsByTeam(team_id)
                // this is for team we fetch all the details of that team to store them
                .then(async (subscriptions) => {
                    // eslint-disable-next-line prefer-const
                    let teamData: {
                        team_id: string;
                        projects: string[];
                        files: string[];
                    } = {
                        team_id: team_id,
                        projects: [],
                        files: []
                    };
                    const files_in_team: string[] = [];
                    const projects_in_team: string[] = [];
                    if (!project_Ids?.length && !file_Ids?.length) {
                        await getRequest(
                            this.read,
                            context,
                            this.http,
                            `https://api.figma.com/v1/teams/${team_id}/projects`
                        )
                            .then(async (team_response) => {
                                const reqUrls = team_response.data.projects.map(
                                    (project: any) => {
                                        projects_in_team.push(project.id);
                                        return `https://api.figma.com/v1/projects/${project.id}/files`;
                                    }
                                );
                                if (projects_in_team) {
                                    try {
                                        await Promise.all(
                                            reqUrls.map(
                                                async (url) =>
                                                    await getRequest(
                                                        this.read,
                                                        context,
                                                        this.http,
                                                        url
                                                    )
                                            )
                                        )
                                            .then((project_data) => {
                                                // todo: do it this way add two input block one for project and one for file and when someone selects a project display the files below it based on the selected project.
                                                project_data.forEach(
                                                    (project) => {
                                                        project.data.files.forEach(
                                                            (
                                                                file // fix this bug which occurs after assigning file type
                                                            ) =>
                                                                files_in_team.push(
                                                                    file.key
                                                                )
                                                        );
                                                    }
                                                );
                                            })
                                            .catch(async () => {
                                                //
                                            });
                                        teamData.projects =
                                            projects_in_team.slice();
                                        teamData.files = files_in_team.slice();
                                    } catch (e) {
                                        //
                                    }
                                }
                            })
                            .catch((error) => {
                                console.log('error: ', error);
                            });
                    }
                    if (subscriptions && subscriptions.length) {
                        for (const subscription of subscriptions) {
                            // for every subscription
                            // 1 - Inside this subscription 🤯 '
                            // now we are entering the room data zone to modify it.
                            // now we are entering the room data zone to modify it.'
                            for (const room_data of subscription.room_data) {
                                // 2 - we are at room data level and this will run as many times as the number of room data we have 🏡
                                const returnValue: {
                                    success: boolean;
                                } = await updateSubscriptionHandler(
                                    context,
                                    this.persistence,
                                    this.read,
                                    this.http,
                                    team_id,
                                    room,
                                    user,
                                    room_data,
                                    event_type,
                                    subscription,
                                    project_Ids,
                                    file_Ids,
                                    subscriptionStorage,
                                    teamData
                                );

                                if (!returnValue.success) {
                                    return;
                                }
                            }
                        }

                        const block = this.modify
                            .getCreator()
                            .getBlockBuilder();

                        if (!project_Ids?.length && !file_Ids?.length) {
                            //todo: update this message later and add subscribed events too
                            block.addSectionBlock({
                                text: {
                                    text: `A new team subscriptions is created by *${user.name}*. You will start receiving notifications for updates and comments inside the team in this channel.> If you have not already connected your figma account, please do so by typing \`/figma\` in the channel.`,
                                    type: TextObjectType.MARKDOWN
                                }
                            });
                            // create button action block
                            block.addActionsBlock({
                                elements: [
                                    block.newButtonElement({
                                        actionId: 'view_team',
                                        text: block.newPlainTextObject(
                                            'View Team Inside Figma'
                                        ),
                                        url: `https://www.figma.com/files/team/${team_id}`
                                    })
                                ]
                            });
                        } else if (project_Ids?.length && !file_Ids?.length) {
                            // get project details from figma
                            // todo: send all the projects details inside channel
                            block.addSectionBlock({
                                text: {
                                    text: `New subscriptions for projects is created by *${user.name}*. You will start receiving notifications for updates and comments inside the project in this channel. If you have not connected your figma account to rocket chat please connect by typing \`/figma connect\``,
                                    type: TextObjectType.MARKDOWN
                                }
                            });

                            block.addActionsBlock({
                                elements: [
                                    block.newButtonElement({
                                        actionId: 'view_projects',
                                        text: block.newPlainTextObject(
                                            'View Projects Inside Figma'
                                        ),
                                        url: `https://www.figma.com/files/team/${team_id}`
                                    })
                                ]
                            });
                        } else if (!project_Ids?.length && file_Ids?.length) {
                            block.addSectionBlock({
                                text: {
                                    text: `New subscriptions for Files is created by *${user.name}*. You will start receiving notifications for updates and comments from these files in this channel. If you have not connected your figma account to rocket chat please connect by typing \`/figma connect\``,
                                    type: TextObjectType.MARKDOWN
                                }
                            });
                            block.addActionsBlock({
                                elements: [
                                    block.newButtonElement({
                                        actionId: 'view_files',
                                        text: block.newPlainTextObject(
                                            'View files Inside Figma'
                                        ),
                                        url: `https://www.figma.com/files/team/${team_id}`
                                    })
                                ]
                            });
                        }
                        await botMessageChannel(
                            this.read,
                            this.modify,
                            room,
                            block
                        );
                    } else {
                        // 1 - no subscription found'
                        let counter = 0;
                        [
                            events.COMMENT,
                            events.DELETE,
                            events.LIBRARY_PUBLISHED,
                            events.UPDATE,
                            events.VERSION_UPDATE
                        ].map(async (event) => {
                            // our main logic is to hook into figma 5 times for every event type
                            const data = {
                                event_type: event,
                                team_id: team_id,
                                endpoint: url,
                                passcode: room.id, // Send room id as passcode
                                description: room.id
                            };
                            // we send request to figma webhook to create a hook for every event ( runs 5 times )
                            await postRequest(
                                this.read,
                                context,
                                this.http,
                                'https://api.figma.com/v2/webhooks',
                                data
                            )
                                .then(async (response) => {
                                    // when a hook is created successfully we save it in db
                                    if (response.data.error === true) {
                                        // todo : manage this logic in a better way which covers all the edge cases. If for any request there is a error response then delete the created hooks and send the error message to user
                                        if (counter === 4) {
                                            await botNotifyCurrentUser(
                                                this.read,
                                                this.modify,
                                                user,
                                                room,
                                                response.data.reason
                                            );
                                            // todo: for now figma gives a reason and says to delete a webhook but modify it to say at least 5 webhooks.
                                        } else {
                                            console.log(
                                                'error: response data error'
                                            );
                                        }
                                    } else {
                                        await createWebhookSubscription
                                            .createWebhookResponseHandler(
                                                context,
                                                response,
                                                room,
                                                user,
                                                project_Ids,
                                                file_Ids,
                                                team_id,
                                                event_type,
                                                event
                                            )
                                            .then(async () => {
                                                if (counter === 4) {
                                                    const block = this.modify
                                                        .getCreator()
                                                        .getBlockBuilder();

                                                    if (
                                                        !project_Ids?.length &&
                                                        !file_Ids?.length
                                                    ) {
                                                        //todo: update this message later and add subscribed events too
                                                        block.addSectionBlock({
                                                            text: {
                                                                text: `A new team subscriptions is created by *${user.name}*. You will start receiving notifications for updates and comments inside the team in this channel. If you have not connected your figma account to rocket chat please connect by typing \`/figma connect\``,
                                                                type: TextObjectType.MARKDOWN
                                                            }
                                                        });
                                                        // create button action block
                                                        block.addActionsBlock({
                                                            elements: [
                                                                block.newButtonElement(
                                                                    {
                                                                        actionId:
                                                                            'view_team',
                                                                        text: block.newPlainTextObject(
                                                                            'View Team Inside Figma'
                                                                        ),
                                                                        url: `https://www.figma.com/files/team/${team_id}`
                                                                    }
                                                                )
                                                            ]
                                                        });
                                                    } else if (
                                                        project_Ids?.length &&
                                                        !file_Ids?.length
                                                    ) {
                                                        // get project details from figma
                                                        // todo: send all the projects details inside channel
                                                        block.addSectionBlock({
                                                            text: {
                                                                text: `New subscriptions for projects is created by *${user.name}*. You will start receiving notifications for updates and comments inside the project in this channel. If you have not connected your figma account to rocket chat please connect by typing \`/figma connect\``,
                                                                type: TextObjectType.MARKDOWN
                                                            }
                                                        });

                                                        block.addActionsBlock({
                                                            elements: [
                                                                block.newButtonElement(
                                                                    {
                                                                        actionId:
                                                                            'view_projects',
                                                                        text: block.newPlainTextObject(
                                                                            'View Projects Inside Figma'
                                                                        ),
                                                                        url: `https://www.figma.com/files/team/${team_id}`
                                                                    }
                                                                )
                                                            ]
                                                        });
                                                    } else if (
                                                        !project_Ids?.length &&
                                                        file_Ids?.length
                                                    ) {
                                                        block.addSectionBlock({
                                                            text: {
                                                                text: `New subscriptions for Files is created by *${user.name}*. You will start receiving notifications for updates and comments from these files in this channel. If you have not connected your figma account to rocket chat please connect by typing \`/figma connect\``,
                                                                type: TextObjectType.MARKDOWN
                                                            }
                                                        });
                                                        block.addActionsBlock({
                                                            elements: [
                                                                block.newButtonElement(
                                                                    {
                                                                        actionId:
                                                                            'view_files',
                                                                        text: block.newPlainTextObject(
                                                                            'View files Inside Figma'
                                                                        ),
                                                                        url: `https://www.figma.com/files/team/${team_id}`
                                                                    }
                                                                )
                                                            ]
                                                        });
                                                    }
                                                    await botMessageChannel(
                                                        this.read,
                                                        this.modify,
                                                        room,
                                                        block
                                                    );
                                                }
                                                return;
                                            })
                                            .catch(async () => {
                                                if (count === 4) {
                                                    await botNotifyCurrentUser(
                                                        this.read,
                                                        this.modify,
                                                        user,
                                                        room,
                                                        'error subscribing to the file please try again'
                                                    );
                                                }
                                                return;
                                            });
                                    }
                                    counter++;
                                })
                                .catch((e) => {
                                    botNotifyCurrentUser(
                                        this.read,
                                        this.modify,
                                        user,
                                        room,
                                        `Error Subscribing to file from figma, ${e.message}`
                                    );
                                })
                                .finally(() => count++);
                        });
                    }
                })
                .catch(async (err) => {
                    return await botNotifyCurrentUser(
                        this.read,
                        this.modify,
                        user,
                        room,
                        `Error Subscribing to file from figma, ${err.message}`
                    );
                })
                .finally(() => {
                    console.log('done: Subscription created successfully');
                });
        } catch (error) {
            await botNotifyCurrentUser(
                this.read,
                this.modify,
                user,
                room,
                `Error Subscribing to file from figma, ${error.message}`
            );
        }

        return {
            success: true
        };
    }
}
