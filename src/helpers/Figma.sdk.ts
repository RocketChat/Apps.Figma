import {
    IHttp,
    IHttpResponse,
    IRead
} from '@rocket.chat/apps-engine/definition/accessors';
import { UIKitViewSubmitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { getAccessTokenForUser } from '../storage/users';

type headers = { Authorization: string };

async function getHeaders(
    read: IRead,
    context: UIKitViewSubmitInteractionContext
): Promise<headers> {
    const token = await getAccessTokenForUser(
        read,
        context.getInteractionData().user
    );

    const headers: { Authorization: string } = {
        Authorization: `Bearer ${token?.token}`
    };

    return headers;
}

export async function getRequest(
    read: IRead,
    context: UIKitViewSubmitInteractionContext,
    http: IHttp,
    url: string
): Promise<IHttpResponse> {
    const headers = await getHeaders(read, context);
    return await http
        .get(url, {
            headers
        })
        .then((r: IHttpResponse) => r)
        .catch((e: IHttpResponse) => e);
}
export async function postRequest(
    read: IRead,
    context: UIKitViewSubmitInteractionContext,
    http: IHttp,
    url: string,
    data: any // todo: remove this any and add a strict type 🐞
): Promise<IHttpResponse> {
    const headers = await getHeaders(read, context);
    return await http
        .post(url, {
            headers,
            data
        })
        .then((r: IHttpResponse) => r)
        .catch((e: IHttpResponse) => e);
}
