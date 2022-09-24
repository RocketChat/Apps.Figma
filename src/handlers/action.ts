import {
    IHttp,
    IHttpResponse,
    IModify,
    IRead
} from '@rocket.chat/apps-engine/definition/accessors';

import {
    IUIKitModalResponse,
    TextObjectType,
    UIKitViewSubmitInteractionContext
} from '@rocket.chat/apps-engine/definition/uikit';
import { FigmaApp } from '../../FigmaApp';
import { getTeamID } from '../sdk/subscription.sdk';
import { getAccessTokenForUser } from '../storage/users';
import { IProjectsResponse } from '../definition';
import { events, modalId, modalTitle } from '../enums/enums';
import { botNotifyCurrentUser, sendMessage } from '../lib/messages';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { getRequest } from '../helpers/Figma.sdk';

type file = {
    key: string;
    name: string;
    thumbnail_url: string;
    last_modified: Date;
};

export class BlockActionHandler {
    constructor(
        private readonly app: FigmaApp,
        private readonly read: IRead,
        private readonly http: IHttp,
        private readonly modify: IModify,
        private readonly user: IUser,
        private readonly room: IRoom
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
        const headers: { Authorization: string } = {
            Authorization: `Bearer ${token?.token}`
        };

        const teamId: string | undefined = getTeamID(team_url);

        if (!teamId || teamId.length < 0) {
            botNotifyCurrentUser(
                this.read,
                this.modify,
                this.user,
                this.room,
                'Cannot get the team ID from url. Please check if the URL is a Team URL.'
            );
            return {
                success: false
            };
        }

        switch (resource_type) {
            case 'file':
                await getRequest(
                    this.read,
                    context,
                    this.http,
                    `https://api.figma.com/v1/teams/${teamId}/projects`
                )
                    .then(async (res: IHttpResponse) => {
                        if (!res) {
                            return await botNotifyCurrentUser(
                                this.read,
                                this.modify,
                                this.user,
                                this.room,
                                'Error connecting with figma server. Please try again after some time. Check logs if it still does not work report the issue.'
                            );
                            //return { success: false };
                        }
                        const projectIds: string[] | undefined =
                            res.data.projects.map(
                                (project: { id: string }) => project.id
                            );

                        const files: file[] | undefined = [];
                        if (projectIds) {
                            const reqUrls = projectIds.map(
                                (projectId) =>
                                    `https://api.figma.com/v1/projects/${projectId}/files`
                            );

                            try {
                                await Promise.all(
                                    reqUrls.map((url) =>
                                        this.http.get(url, {
                                            headers
                                        })
                                    )
                                )
                                    .then((project_data) => {
                                        // todo: do it this way add two input block one for project and one for file and when someone selects a project display the files below it based on the selected project.
                                        project_data.forEach((project) => {
                                            project.data.files.forEach(
                                                (file: file) => {
                                                    files.push(file);
                                                }
                                            );
                                        });
                                    })
                                    .catch(async () => {
                                        return await botNotifyCurrentUser(
                                            this.read,
                                            this.modify,
                                            this.user,
                                            this.room,
                                            'Something went wrong while fetching files. Please report the issue.'
                                        );
                                    });
                            } catch (e) {
                                return await botNotifyCurrentUser(
                                    this.read,
                                    this.modify,
                                    this.user,
                                    this.room,
                                    'Something went wrong while fetching files. Please report the issue.'
                                );
                            }
                        }

                        const filesListFromResponse: {
                            text: {
                                emoji: boolean;
                                text: string;
                                type: TextObjectType.PLAINTEXT;
                            };
                            value: string;
                        }[] = files.map((file: file) => ({
                            text: {
                                emoji: true,
                                text: file.name,
                                type: TextObjectType.PLAINTEXT
                            },
                            value: file.key
                        }));

                        const selectFiles = block.newMultiStaticElement({
                            actionId: 'files',
                            options: filesListFromResponse,
                            placeholder: {
                                type: TextObjectType.PLAINTEXT,
                                text: 'Select Files'
                            }
                        });

                        block.addSectionBlock({
                            text: {
                                text: 'Select the Files and File events you want to receive notifications for in this channel or team which are visible to everyone.',
                                type: TextObjectType.PLAINTEXT
                            }
                        });

                        block.addDividerBlock();

                        block.addInputBlock({
                            label: {
                                text: 'Select Files',
                                type: TextObjectType.PLAINTEXT
                            },
                            element: selectFiles,
                            blockId: 'selectedFiles'
                        });
                    })
                    .catch(async () => {
                        return await botNotifyCurrentUser(
                            this.read,
                            this.modify,
                            this.user,
                            this.room,
                            'Error connecting with figma server. Please try again later.'
                        );
                    });
                break;
            case 'team':
                block.addSectionBlock({
                    text: {
                        text: 'Select the Team Events you want to receive notifications for. Users in this channel will only be notify for all the files that are in the team and have edit access, or are in view-only projects.',
                        type: TextObjectType.PLAINTEXT
                    }
                });

                break;
            case 'project':
                await getRequest(
                    this.read,
                    context,
                    this.http,
                    `https://api.figma.com/v1/teams/${teamId}/projects`
                )
                    .then(async (res) => {
                        if (!res) {
                            return await botNotifyCurrentUser(
                                this.read,
                                this.modify,
                                this.user,
                                this.room,
                                'Error connecting with figma server. Please try again after some time. Check logs if it still does not work report the issue'
                            );
                        } else {
                            block.addSectionBlock({
                                text: {
                                    text: 'Select the Projects and events inside files in those projects you want to receive notifications for in this channel or team which are visible to everyone.',
                                    type: TextObjectType.PLAINTEXT
                                }
                            });

                            block.addDividerBlock();

                            const projectsListFromResponse: [] =
                                res?.data?.projects?.map(
                                    (project: IProjectsResponse) => ({
                                        text: {
                                            emoji: true,
                                            text: project.name,
                                            type: TextObjectType.PLAINTEXT
                                        },
                                        value: project.id
                                    })
                                );

                            const selectProject = block.newMultiStaticElement({
                                actionId: 'projects',
                                options: projectsListFromResponse,
                                placeholder: {
                                    type: TextObjectType.PLAINTEXT,
                                    text: 'Select Projects'
                                }
                            });

                            block.addInputBlock({
                                label: {
                                    text: 'Select Projects',
                                    type: TextObjectType.PLAINTEXT
                                },
                                element: selectProject,
                                blockId: 'selectedProjects'
                            });
                        }
                    })
                    .catch(async () => {
                        await botNotifyCurrentUser(
                            this.read,
                            this.modify,
                            this.user,
                            this.room,
                            'Something went wrong while fetching files. Please report the issue.'
                        );
                        return { success: false };
                    });
                break;
            default:
                return { success: false };
        }

        const newMultiStaticElement = block.newMultiStaticElement({
            actionId: 'events',
            options: [
                {
                    value: events.COMMENT,
                    text: {
                        type: TextObjectType.PLAINTEXT,
                        text: 'New Comments',
                        emoji: true
                    }
                },
                {
                    value: events.UPDATE,
                    text: {
                        type: TextObjectType.PLAINTEXT,
                        text: 'File Updates',
                        emoji: true
                    }
                },
                {
                    value: events.VERSION_UPDATE,
                    text: {
                        type: TextObjectType.PLAINTEXT,
                        text: 'File Version Updates',
                        emoji: true
                    }
                },
                {
                    value: events.DELETE,
                    text: {
                        type: TextObjectType.PLAINTEXT,
                        text: 'File Delete',
                        emoji: true
                    }
                },
                {
                    value: events.LIBRARY_PUBLISHED,
                    text: {
                        type: TextObjectType.PLAINTEXT,
                        text: 'Library Publish',
                        emoji: true
                    }
                }
            ],
            placeholder: {
                type: TextObjectType.PLAINTEXT,
                text: 'Select Events'
            }
        });

        block.addInputBlock({
            label: {
                text: 'Select Events',
                type: TextObjectType.PLAINTEXT
            },
            element: newMultiStaticElement,
            blockId: 'selectedEvents'
        });

        const resource_type_Capital =
            resource_type.charAt(0).toUpperCase() + resource_type.slice(1);

        // get the modal and update its view
        const response = context
            .getInteractionResponder()
            .updateModalViewResponse({
                id: modalId.SUBSCRIPTION_VIEW,
                title: block.newPlainTextObject(modalTitle.EVENT_MODAL),
                close: block.newButtonElement({
                    text: {
                        type: TextObjectType.PLAINTEXT,
                        text: 'Cancel'
                    }
                }),
                submit: block.newButtonElement({
                    actionId: modalId.EVENT_MODAL_VIEW,
                    text: {
                        type: TextObjectType.PLAINTEXT,
                        text: 'Submit'
                    }
                }),

                blocks: block.getBlocks()
            });
        return response;
    }
}
