import {
    IHttp,
    IHttpResponse,
    IRead
} from '@rocket.chat/apps-engine/definition/accessors';
import { UIKitViewSubmitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { getRequest } from './Figma.sdk';

export class GetResourcesFromFigma {
    constructor(private readonly read: IRead, private readonly http: IHttp) {}

    public async getAllTeamFiles(
        context: UIKitViewSubmitInteractionContext,
        teamId: string
    ) {
        await getRequest(
            this.read,
            context,
            this.http,
            `https://api.figma.com/v1/teams/${teamId}/projects`
        ).then(async (team_response) => {
            const reqUrls = team_response.data.projects.map(
                (project: any) =>
                    `https://api.figma.com/v1/projects/${project.id}/files`
            );
            return await Promise.all(
                reqUrls.map(
                    async (url: string) =>
                        await getRequest(this.read, context, this.http, url)
                )
            )
        });
    }
    public async getAllTeamProjects(
        context: UIKitViewSubmitInteractionContext,
        teamId: string
    ) {
        await getRequest(
            this.read,
            context,
            this.http,
            `https://api.figma.com/v1/teams/${teamId}/projects`
        ).then((res) => {
            console.log('response from figma for projects - ', res.data);
        });
    }
    public async getAllProjectFiles() {
        //
    }
}
