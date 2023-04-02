import {
    IHttp,
    IHttpResponse,
    IPersistence,
    IRead
} from '@rocket.chat/apps-engine/definition/accessors';
import { UIKitViewSubmitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { getProjectFilesUrl, getTeamProjectsUrl } from '../lib/const';
import { getRequest } from './Figma.sdk';

// create a function to get all the files inside a project from figma using this code
export async function getAllTeamFiles(
    context: UIKitViewSubmitInteractionContext,
    persistence: IPersistence,
    read: IRead,
    http: IHttp,
    teamId: string
) {
    const teamUrl=getTeamProjectsUrl(teamId);
    await getRequest(
        this.read,
        context,
        this.http,
        teamUrl
    ).then(async (team_response) => {
        const reqUrls = team_response.data.projects.map(
            (project: any) =>
                getProjectFilesUrl(project.id)
        );
        try {
            await Promise.all(
                reqUrls.map(
                    async (url: string) =>
                        await getRequest(read, context, http, url)
                )
            )
                .then((res) => {
                    console.log('response from figma for files - ', res);
                })
                .catch((e) => {
                    return e;
                });
        } catch {
            console.log('error: - ');
            return;
        }
    });
}
///////
