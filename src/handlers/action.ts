import {
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import {
    BlockElementType,
    IUIKitResponse,
    TextObjectType,
    UIKitBlockInteractionContext,
    UIKitViewSubmitInteractionContext,
} from '@rocket.chat/apps-engine/definition/uikit';
import { FigmaApp } from '../../FigmaApp';
import { eventModal } from '../modals/events';
import { subscriptionsModal } from '../modals/subscription';
import { getTeamID } from '../sdk/subscription.sdk';
import { getAccessTokenForUser } from '../storage/users';
import { IProjectsResponse } from '../definition';

export class BlockActionHandler {
    constructor(
        private readonly app: FigmaApp,
        private readonly read: IRead,
        private readonly http: IHttp,
        private readonly modify: IModify,
        private readonly persistence: IPersistence
    ) {}

    public async run(
        context: UIKitViewSubmitInteractionContext,
        team_url: string,
        resource_type: string
    ) {
        const block = this.modify.getCreator().getBlockBuilder();
        const token = await getAccessTokenForUser(
            this.read,
            context.getInteractionData().user
        );
        const headers: any = {
            Authorization: `Bearer ${token?.token}`,
        };

        const teamId: string = getTeamID(team_url);

        if (teamId.length < 0) {
            console.log('team id not found 🔴');
            return;
        }

        switch (resource_type) {
            case 'file':
                // file is selected
                // endpoint for getting all the projects in the team - /v1/teams/:team_id/projects

                await this.http
                    .get(`https://api.figma.com/v1/teams/${teamId}/projects`, {
                        headers,
                    })
                    .then((res) => {
                        // send a request to /v1/projects/:project_id/files and get all the files inside every project of the team
                        const projectIds = res.data.projects.map((project) => {
                            return project.id;
                        });
                        const projectFiles = projectIds.map(
                            async (projectId) => {
                                return await this.http
                                    .get(
                                        `https://api.figma.com/v1/projects/${projectId}/files`,
                                        { headers }
                                    )
                                    .then((res) => {
                                        block.addSectionBlock({
                                            text: {
                                                text: 'Select the Project and Files to receive notification 🔔. Users in this channel will only be notify for files that are available to everyone on the team, or are in view-only projects.',
                                                type: TextObjectType.PLAINTEXT,
                                            },
                                        });

                                        block.addDividerBlock();

                                        const projectsListFromResponse: [] =
                                            res.data.projects.map(
                                                (
                                                    project: IProjectsResponse
                                                ) => {
                                                    return {
                                                        text: {
                                                            emoji: true,
                                                            text: project.name,
                                                            type: TextObjectType.PLAINTEXT,
                                                        },
                                                        value: project.id,
                                                    };
                                                }
                                            );

                                        let selectProject =
                                            block.newStaticSelectElement({
                                                actionId: 'events',
                                                options:
                                                    projectsListFromResponse,
                                                placeholder: {
                                                    type: TextObjectType.PLAINTEXT,
                                                    text: 'Select a Project',
                                                },
                                            });

                                        block.addInputBlock({
                                            label: {
                                                text: 'Select Projects',
                                                type: TextObjectType.PLAINTEXT,
                                            },
                                            element: selectProject,
                                            blockId: 'selectedProjects',
                                        });
                                    });
                            }
                        );
                    });

                break;
            case 'team':
                // team is selected

                break;
            case 'project':
                // project is selected
                console.log('project is selected');
                await this.http
                    .get(`https://api.figma.com/v1/teams/${teamId}/projects`, {
                        headers,
                    })
                    .then((res) => {
                        console.log('inside projects block');
                        block.addSectionBlock({
                            text: {
                                text: 'Select the Project to receive notification 🔔. Users in this channel will only be notify for all the files that are in the project and have edit access, or are in view-only projects.',
                                type: TextObjectType.PLAINTEXT,
                            },
                        });

                        block.addDividerBlock();

                        const projectsListFromResponse: [] =
                            res?.data?.projects?.map(
                                (project: IProjectsResponse) => {
                                    return {
                                        text: {
                                            emoji: true,
                                            text: project.name,
                                            type: TextObjectType.PLAINTEXT,
                                        },
                                        value: project.id,
                                    };
                                }
                            );

                        let selectProject = block.newMultiStaticElement({
                            actionId: 'projects',
                            options: projectsListFromResponse,
                            placeholder: {
                                type: TextObjectType.PLAINTEXT,
                                text: 'Select Projects',
                            },
                        });

                        block.addInputBlock({
                            label: {
                                text: 'Select Projects',
                                type: TextObjectType.PLAINTEXT,
                            },
                            element: selectProject,
                            blockId: 'selectedProjects',
                        });
                    })
                    .catch((err) => {
                        console.log('error while connecting to figma -', err);
                    });
                break;

            default:
                console.log('no option selected');
                break;
        }

        const newMultiStaticElement = block.newMultiStaticElement({
            actionId: 'events',
            options: [
                {
                    value: 'FILE_COMMENT',
                    text: {
                        type: TextObjectType.PLAINTEXT,
                        text: 'New Comments',
                        emoji: true,
                    },
                },
                {
                    value: 'FILE_UPDATE',
                    text: {
                        type: TextObjectType.PLAINTEXT,
                        text: 'File Updates',
                        emoji: true,
                    },
                },
                {
                    value: 'FILE_VERSION_UPDATE',
                    text: {
                        type: TextObjectType.PLAINTEXT,
                        text: 'File Version Updates',
                        emoji: true,
                    },
                },
                {
                    value: 'FILE_DELETE',
                    text: {
                        type: TextObjectType.PLAINTEXT,
                        text: 'File Delete',
                        emoji: true,
                    },
                },
                {
                    value: 'LIBRARY_PUBLISH',
                    text: {
                        type: TextObjectType.PLAINTEXT,
                        text: 'Library Publish',
                        emoji: true,
                    },
                },
            ],
            placeholder: {
                type: TextObjectType.PLAINTEXT,
                text: 'Select Events',
            },
        });

        block.addInputBlock({
            label: {
                text: 'Select the Events you want to subscribe to',
                type: TextObjectType.PLAINTEXT,
            },
            element: newMultiStaticElement,
            blockId: 'selectedEvents',
        });

        block.addDividerBlock();

        const response = context
            .getInteractionResponder()
            .updateModalViewResponse({
                id: 'subscriptionView',
                title: block.newPlainTextObject('Select Event Types'),
                close: block.newButtonElement({
                    text: {
                        type: TextObjectType.PLAINTEXT,
                        text: 'Cancel',
                    },
                }),
                submit: block.newButtonElement({
                    actionId: 'secondModal',
                    text: {
                        type: TextObjectType.PLAINTEXT,
                        text: 'Submit',
                    },
                }),

                blocks: block.getBlocks(),
            });
        console.log('here - ');
        return response;
    }
}
