import { ApiEndpoint } from "@rocket.chat/apps-engine/definition/api";
import {
    IRead,
    IHttp,
    IModify,
    IPersistence,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    IApiEndpointInfo,
    IApiEndpoint,
    IApiRequest,
    IApiResponse,
} from "@rocket.chat/apps-engine/definition/api";
import { Subscription } from "../sdk/webhooks.sdk";
import { ISubscription } from "../definition";
export class figmaWebHooks extends ApiEndpoint {
    public path = "figmawebhook";

    // this method is called when the endpoint is called
    public async post(
        request: IApiRequest,
        endpoint: IApiEndpointInfo,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<IApiResponse> {
        let event: string = request.headers["x-github-event"] as string;
        let payload: any;

        // if the event is a push event, the payload is a json object else it is a string
        if (
            request.headers["content-type"] ===
            "application/x-www-form-urlencoded"
        ) {
            payload = JSON.parse(request.content.payload);
        } else {
            payload = request.content;
        }

        let subscriptionStorage = new Subscription(
            persis,
            read.getPersistenceReader()
        );

        const subscriptions: Array<ISubscription> =
            await subscriptionStorage.getSubscribedRooms(
                payload.repository.full_name,
                event
            );
        if (!subscriptions || subscriptions.length == 0) {
            return this.success();
        }
        const eventCaps = event.toUpperCase();
        let messageText = "newEvent !";

        if (event == "push") {
            messageText = `*New Commits to* *[${payload.repository.full_name}](${payload.repository.html_url}) by ${payload.pusher.name}*`;
        } else if (event == "pull_request") {
            messageText = `*[New Pull Reqeust](${payload.pull_request.html_url})*  *|* *#${payload.pull_request.number} ${payload.pull_request.title}* by *[${payload.user.login}](${payload.user.html_url})* *|* *[${payload.repository.full_name}]*`;
        } else if (event == "issues") {
            messageText = `*[New Issue](${payload.issue.html_url})* *|*  *#${payload.issue.number}* *${payload.issue.title}* *|* *[${payload.repository.full_name}](${payload.repository.html_url})*  `;
        } else if (event == "deployment_status") {
            messageText = `*Deployment Status ${payload.deployment_status.state}* *|*  *${payload.repository.full_name}*`;
        } else if (event == "star"){
            if(payload?.action == "created"){
                messageText = `*New Stars on* *${payload.repository.full_name}*  *|* *${payload.repository.stargazers_count}* ⭐`;
            }else{
                return this.success();
            }
        }

        console.log(request.content.toString());
        return this.success();
    }
}
