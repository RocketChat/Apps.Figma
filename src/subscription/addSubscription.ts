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
import { sendNotificationToUsers } from "../lib/messages";
import { IProjectModalData } from "../definition";
import { events } from "../enums/index";
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
        const project_Ids = state?.selectedProjects.projects;
        const team_id = getTeamID(state?.team_url.url);
        const webhook_url = await getWebhookUrl(this.app);

        // refer this fig jam file for the flow of this code https://www.figma.com/file/hufAYVAtxhcxv56WKM0jLi/Figma-App?node-id=7%3A308

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
                            "You are not connect to figma!"
                        );
                    } else {
                        const url = await getWebhookUrl(this.app);
                        // check in persistence if subscription already exists for this team
                        console.log("[1] - Project Data entered ", {
                            team_id: team_id,
                            room_id: room.id,
                            selected_events: event_type,
                            selected_projects: project_Ids,
                        });

                        const subscriptionStorage = new Subscription(
                            this.persistence,
                            this.read.getPersistenceReader()
                        );

                        // subscriptionStorage.getAllSubscriptions().then((r) => {
                        //     console.log("all subscriptions ", r);
                        // });
                        // subscriptionStorage
                        //     .deleteSubscriptionByTeamId(team_id)
                        //     .then((res) => {
                        //         console.log("deleted subscriptions - ", res);
                        //     });
                        subscriptionStorage
                            .getSubscriptionsByTeam(team_id)
                            .then((subscriptions) => {
                                if (subscriptions && subscriptions.length) {
                                    for (const subscription of subscriptions) {
                                        // for every subscription from those 5
                                        if (subscription.team_id === team_id) {
                                            // check once again if team id matches not important as we already have checked it, but just to be safe
                                            console.log(
                                                "[3] - team id matched to the stored team id and hook id is ",
                                                subscription.webhook_id
                                            );
                                            if (
                                                subscription.room_data.length >
                                                0
                                            ) {
                                                // now for every subscription check if the room exists inside room_data array so room data array length should be greater than 0
                                                // now will check in every room_data if the room id matches with the room id of the room we are currently in then will add projects and files into it.
                                                for (const room_data of subscription.room_data) {
                                                    if (
                                                        room_data.room_id ===
                                                        room.id
                                                    ) {
                                                        console.log(
                                                            "[4] - current room id matched to the stored room id - stored room id is - ",
                                                            subscription.room_data
                                                        );
                                                        // update this object of room_data with the new projects and files
                                                        subscriptionStorage
                                                            .updateSubscriptionByTeamId(
                                                                "subscription",
                                                                subscription.webhook_id,
                                                                subscription.team_id,
                                                                room,
                                                                user.id,
                                                                subscription.event_name,
                                                                project_Ids
                                                            )
                                                            .then((res) => {
                                                                console.log(
                                                                    "updated subscription",
                                                                    res
                                                                );
                                                            })
                                                            .catch((err) => {
                                                                console.log(
                                                                    err
                                                                );
                                                            });
                                                    }
                                                }
                                            } else {
                                                // nothing is stored in room data it is not possible ( only possible when the last subscription is also deleted )
                                            }
                                        } else {
                                            console.log(
                                                "[4] - current room id ",
                                                room.id,
                                                " not in the stored room id - stored room id is -> ",
                                                subscription.room_data
                                            );
                                            // if the room does not exist then update the subscription
                                        }
                                    }

                                    console.log("[5] - subscription updated");
                                    // send notification to the user that subscription has been updated
                                    sendNotificationToUsers(
                                        this.read,
                                        this.modify,
                                        user,
                                        room,
                                        "Subscription updated successfully!"
                                    );
                                } else {
                                    // subscribing to all the five events one by one
                                    [
                                        events.COMMENT,
                                        events.DELETE,
                                        events.LIBRARY_PUBLISHED,
                                        events.UPDATE,
                                        events.VERSION_UPDATE,
                                    ].map((event, key) => {
                                        const data = {
                                            event_type: event,
                                            team_id,
                                            endpoint: url,
                                            passcode: room.id, // send room id as passcode
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
                                            .then(async (response) => {
                                                if (response.data.error) {
                                                    console.log(
                                                        "[3] - error from figma - ",
                                                        response.data.error,
                                                        " - for - ",
                                                        key,
                                                        event
                                                    );
                                                    throw new Error(
                                                        response.data.error
                                                    );
                                                } else {
                                                    console.log(
                                                        "[3] Successfully subscribed to -",
                                                        key,
                                                        event,
                                                        " - and response from figma 🥳 is -",
                                                        response.data
                                                    );
                                                    const hookId =
                                                        response.data.id;

                                                    await subscriptionStorage
                                                        .storeSubscriptionByEvent(
                                                            "subscription",
                                                            hookId,
                                                            team_id,
                                                            room,
                                                            user,
                                                            event,
                                                            project_Ids
                                                        )
                                                        .then((res) => {
                                                            // when subscription is stored update it with the current passed room id for only subscribed events
                                                            event_type.map(
                                                                (event) => {
                                                                    const newRoomsArray: string[] =
                                                                        [
                                                                            room.id,
                                                                        ];
                                                                    console.log(
                                                                        "updated room_ids array will be - ",
                                                                        newRoomsArray,
                                                                        "- for event - ",
                                                                        event
                                                                    );
                                                                    subscriptionStorage.updateSubscriptionByTeamId(
                                                                        "subscription",
                                                                        hookId,
                                                                        team_id,
                                                                        room,
                                                                        user.id,
                                                                        event,
                                                                        project_Ids
                                                                    );
                                                                }
                                                            );
                                                        })
                                                        .catch((e) => {
                                                            console.log(
                                                                "[4] - error storing subscription in storage - ",
                                                                e,
                                                                " - for - ",
                                                                key,
                                                                event
                                                            );
                                                        });
                                                }
                                            })
                                            .catch((err) => {
                                                console.log(
                                                    "[3] - Error subscribed to -",
                                                    key,
                                                    event,
                                                    " - and error is -",
                                                    err
                                                );
                                            });
                                    });
                                }
                            })
                            .catch((err) =>
                                console.log(
                                    "[2] - Error getting subscriptions from storage - ",
                                    err
                                )
                            );
                    }
                    return;
                }
            }
        } catch (error) {
            console.log("error user id does not exist : ", error);
        }
        return {
            success: true,
        };
    }
}
