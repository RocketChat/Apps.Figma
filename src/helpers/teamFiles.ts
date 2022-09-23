import {
    IHttp,
    IHttpResponse,
    IPersistence,
    IRead
} from '@rocket.chat/apps-engine/definition/accessors';
import { UIKitViewSubmitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { getRequest } from './Figma.sdk';

// create a function to get all the files inside a project from figma using this code
export async function getAllTeamFiles(
    context: UIKitViewSubmitInteractionContext,
    persistence: IPersistence,
    read: IRead,
    http: IHttp,
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
