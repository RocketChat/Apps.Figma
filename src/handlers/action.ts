import {IHttp,
	IModify,
	IPersistence,
	IRead} from '@rocket.chat/apps-engine/definition/accessors';
import {TextObjectType,
	UIKitViewSubmitInteractionContext} from '@rocket.chat/apps-engine/definition/uikit';
import { FigmaApp } from '../../FigmaApp';
import { getTeamID } from '../sdk/subscription.sdk';
import { getAccessTokenForUser } from '../storage/users';
import { IProjectsResponse } from '../definition';
import { events } from '../enums/index';

type file = {
    key: string;
    name: string;
    thumbnail_url: string;
    last_modified: Date;
};
type project = {
    name: string;
    files: file[];
};
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
		const headers: { Authorization: string } = {
			Authorization: `Bearer ${token?.token}`
		};

		const teamId: string = getTeamID(team_url);

		if (teamId.length < 0) {
			console.log('team id not found 🔴');
			return;
		}

		switch (resource_type) {
		case 'file':
			await this.http
				.get(`https://api.figma.com/v1/teams/${teamId}/projects`, {
					headers
				})
				.then(async (res) => {
					// Send a request to /v1/projects/:project_id/files and get all the files inside every project of the team
					const projectIds: string[] | undefined =
                            res.data.projects.map((project) => project.id);
					const files: file[] | undefined = [];
					console.log('project ids - ', projectIds);

					if (projectIds) {
						const reqUrls = projectIds.map(
							(projectId) =>
								`https://api.figma.com/v1/projects/${projectId}/files`
						);
						console.log('reqUrls - ', reqUrls);

						try {
							await Promise.all(
								reqUrls.map((url) =>
									this.http.get(url, {
										headers
									})
								)
							)
								.then((project_data) => {
									console.log(
										'files response4 - ',
										project_data
									);
									// todo: do it this way add two input block one for project and one for file and when someone selects a project display the files below it based on the selected project.
									project_data.forEach((project) => {
										project.data.files.forEach(
											(file: file) => {
												files.push(file);
											}
										);
									});
									console.log('files array - ', files);
								})
								.catch((err) => {
									console.log('err - ', err);
								});

						} catch (e) {
							console.log('error - ', e);
						}
					}

					const filesListFromResponse: any[] =
                    files.map(
                    	(file: file) => ({
                    		text: {
                    			emoji: true,
                    			text: file.name,
                    			type: TextObjectType.PLAINTEXT
                    		},
                    		value: file.key
                    	})
                    );

					const selectFiles = block.newMultiStaticElement({
						actionId: 'files',
						options: filesListFromResponse,
						placeholder: {
							type: TextObjectType.PLAINTEXT,
							text: 'Select Files'
						}
					});

					block.addInputBlock({
						label: {
							text: 'Select Files',
							type: TextObjectType.PLAINTEXT
						},
						element: selectFiles,
						blockId: 'selectedFiles'
					});
				});

			break;
		case 'team':
			// Team is selected
			console.log('inside team block');
			block.addSectionBlock({
				text: {
					text: 'Select the Team Events you want to receive notifications for. Users in this channel will only be notify for all the files that are in the project and have edit access, or are in view-only projects.',
					type: TextObjectType.PLAINTEXT
				}
			});

			break;
		case 'project':
			// Project is selected
			console.log('project is selected');
			await this.http
				.get(`https://api.figma.com/v1/teams/${teamId}/projects`, {
					headers
				})
				.then((res) => {
					console.log('inside projects block');
					block.addSectionBlock({
						text: {
							text: 'Select the Project to receive notification 🔔. Users in this channel will only be notify for all the files that are in the project and have edit access, or are in view-only projects.',
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
				text: 'Select the Events you want to subscribe to',
				type: TextObjectType.PLAINTEXT
			},
			element: newMultiStaticElement,
			blockId: 'selectedEvents'
		});

		block.addDividerBlock();
        console.log('-2');
		const response = context
			.getInteractionResponder()
			.updateModalViewResponse({
				id: 'subscriptionView',
				title: block.newPlainTextObject('Select Event Types'),
				close: block.newButtonElement({
					text: {
						type: TextObjectType.PLAINTEXT,
						text: 'Cancel'
					}
				}),
				submit: block.newButtonElement({
					actionId: 'secondModal',
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
