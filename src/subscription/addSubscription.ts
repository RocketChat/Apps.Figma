import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { UIKitViewSubmitInteractionContext } from "@rocket.chat/apps-engine/definition/uikit";

import { FigmaApp } from "../../FigmaApp";
import { getTeamID, getWebhookUrl } from "../sdk/subscription.sdk";
import { getAccessTokenForUser } from "../storage/users";
import { Subscription } from "../sdk/webhooks.sdk";
import { getInteractionRoomData } from "../storage/room";
import { sendNotificationToUsers } from "../lib/messages";
import { createSubscription, updateSubscription } from "../helpers/Figma.sdk";
import { IProjectModalData } from "../definition";
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord,
} from "@rocket.chat/apps-engine/definition/metadata";
import { IModalContext } from "../definition";

export class AddSubscription {
    constructor(
        private readonly app: FigmaApp,
        private readonly read: IRead,
        private readonly http: IHttp,
        private readonly modify: IModify,
        private readonly persistence: IPersistence
    ) {}

    public async run(context: UIKitViewSubmitInteractionContext, room: IRoom) {
        const { user, view } = context.getInteractionData();
        const { state }: IProjectModalData = view as any;
        const event_type = state?.selectedEvents.events;
        const projectsIds = state?.selectedProjects.projects;
        const team_id = getTeamID(state?.team_url.url);
        const webhook_url = await getWebhookUrl(this.app);

        try {
            if (user.id) {
                if (
                    typeof team_id == undefined ||
                    typeof event_type == undefined
                ) {
                    await sendNotificationToUsers(
                        this.read,
                        this.modify,
                        user,
                        room,
                        "Invalid Input !"
                    );
                } else {
                    const accessToken = await getAccessTokenForUser(
                        this.read,
                        user
                    );

                    if (!accessToken) {
                        await sendNotificationToUsers(
                            this.read,
                            this.modify,
                            user,
                            room,
                            "Connect with figma first !"
                        );
                    } else {
                        console.log("here ----");
                        const url = await getWebhookUrl(this.app);
                        // check in persistence if subscription already exists for this team

                        const subscriptionStorage = new Subscription(
                            this.persistence,
                            this.read.getPersistenceReader()
                        );
                        // let subscribedEvents = new Map<string, boolean>;

                        subscriptionStorage
                            .getSubscriptionsByTeam(team_id)
                            .then((subscriptions) => {
                                console.log(
                                    "subscriptions here ",
                                    subscriptions
                                );
                                if (subscriptions && subscriptions.length) {
                                    for (const subscription of subscriptions) {
                                        //   subscribedEvents.set(subscription.events, true);
                                        if (subscription.team_id === team_id) {
                                            console.log(
                                                "subscription already exists 🤔"
                                            );
                                        } else {
                                            console.log(
                                                "subscription exists but team_id not equal stored in memory 🤔"
                                            );
                                        }
                                        console.log(
                                            "subscription already exists 🤔"
                                        );
                                    }
                                } else {
                                    const data = {
                                        event_type: event_type[0],
                                        team_id,
                                        endpoint: url,
                                        passcode: "123456789",
                                        description: room.id,
                                    };

                                    this.http
                                        .post(
                                            `https://api.figma.com/v2/webhooks`,
                                            {
                                                headers: {
                                                    Authorization: `Bearer ${accessToken?.token}`,
                                                },
                                                data,
                                            }
                                        )
                                        .then(async (res) => {
                                            if (res.data.error) {
                                                console.log(
                                                    "error - ",
                                                    res.data
                                                );
                                                throw new Error(res.data.error);
                                            } else {
                                                console.log(
                                                    "success - ",
                                                    res.data
                                                );
                                                const hookId = res.data.id;

                                                await subscriptionStorage
                                                    .storeSubscription(
                                                        "hello",
                                                        event_type,
                                                        projectsIds,
                                                        hookId,
                                                        team_id,
                                                        room,
                                                        user
                                                    )
                                                    .then((res) => {
                                                        console.log(
                                                            "storage response - ",
                                                            res
                                                        );
                                                    });
                                            }
                                        })
                                        .catch((err) => {
                                            console.log(
                                                "error subscribing file",
                                                err
                                            );
                                        });
                                }
                                // if hook is null we create a new hook, else we add more events to the new hook
                            })
                            .catch((err) =>
                                console.log("error subscribing project", err)
                            );
                    }
                    return;
                }
            }
        } catch (error) {
            console.log("error : ", error);
        }
        return {
            success: true,
        };
    }
}
