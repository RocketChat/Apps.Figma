import {
    IHttp,
    IHttpResponse,
    IRead
} from '@rocket.chat/apps-engine/definition/accessors';
import { UIKitViewSubmitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { getProjectFilesUrl, getTeamProjectsUrl } from '../lib/const';
import { getRequest } from './Figma.sdk';

export class GetResourcesFromFigma {
    constructor(private readonly read: IRead, private readonly http: IHttp) {}

    public async getAllTeamFiles(
        context: UIKitViewSubmitInteractionContext,
        teamId: string
    ) {
        const url = getTeamProjectsUrl(teamId);
        await getRequest(
            this.read,
            context,
            this.http,
            url
        ).then(async (team_response) => {
            const reqUrls = team_response.data.projects.map(
                (project: any) =>
                    getProjectFilesUrl(project.id)
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
        const url2=getTeamProjectsUrl(teamId);
        await getRequest(
            this.read,
            context,
            this.http,
            url2
        ).then((res) => {
            console.log('response from figma for projects - ', res.data);
        });
    }
    public async getAllProjectFiles() {
        //
    }
}
