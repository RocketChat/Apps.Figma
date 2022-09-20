import {
    IHttp,
    IHttpResponse,
    IPersistence,
    IRead
} from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { UIKitViewSubmitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { ISubscription, storedRoomData } from '../../definition';
import { getRequest } from '../../helpers/Figma.sdk';
import { Subscription } from '../../sdk/webhooks.sdk';
import { removeDuplicates } from '../../helpers/removeDuplicates';

type file = {
    key: string;
    name: string;
    thumbnail_url: string;
    last_modified: Date;
};

export async function updateSubscriptionHandler(
    context: UIKitViewSubmitInteractionContext,
    persistence: IPersistence,
    read: IRead,
    http: IHttp,
    teamId: string,
    room: IRoom,
    user: IUser,
    room_data: storedRoomData,
    user_passed_event_type_arr: string[],
    subscription: ISubscription, // the subscription which we are currently updating
    project_Ids: string[] | undefined,
    file_Ids: string[] | undefined,
    subscriptionStorage: Subscription,
    teamData?: any
): Promise<{ success: boolean }> {
    // lets update only those event matches with previous events and remove room from those events which are not there in the current passed data by user
    // room id will be unique for every object inside room_data
    if (room_data.room_Id === room.id) {
            // 4 - current room id matched to stored room id of subscription - CURRENT EVENT
        if (user_passed_event_type_arr.includes(subscription.event_name)) {
           // 5 - current user passed event matched to stored event of subscription
            const newRoomData: storedRoomData[] = [];
            // mow we will check either it is a team subscription or project subscription or file subscription
            if (!project_Ids?.length && !file_Ids?.length) {
                // this is a team subscription
                // 6 - this is for team subscription team data to be stored  ole.log(
                //7 - previous data into inside this rooms data for same webhookid/event
                // now append team data into prev room data
                const prevFiles = room_data.file_Ids?.slice();
                const newFiles = teamData.files.slice();
                let allFiles: string[];
                if (prevFiles && newFiles) {
                    allFiles = [...prevFiles, ...newFiles];
                } else if (newFiles && !prevFiles) {
                    allFiles = newFiles;
                } else if (!newFiles && prevFiles) {
                    allFiles = prevFiles;
                } else {
                    allFiles = [];
                }

                const prevProjects = room_data.project_Ids?.slice();
                const newProjects = teamData.projects.slice();
                let allProjects: string[];
                if (prevProjects && newProjects) {
                    allProjects = [...prevProjects, ...newProjects];
                } else if (newProjects && !prevProjects) {
                    allProjects = newProjects;
                } else if (!newProjects && prevProjects) {
                    allProjects = prevProjects;
                } else {
                    allProjects = [];
                }

                const uniqueFiles = removeDuplicates(allFiles);
                const uniqueProjects = removeDuplicates(allProjects);

                const room_data_to_be_stored: storedRoomData = {
                    room_Id: room.id,
                    project_Ids: uniqueProjects,
                    file_Ids: uniqueFiles
                };
                newRoomData.push(room_data_to_be_stored);
            } else if (!project_Ids?.length && file_Ids?.length) {
                // this is a file subscription always remember for files subscription we will not have project ids
                // 6 - this is for file subscription we got this data here
                // 7 - previous data into inside this rooms data for same webhook/event

                const prevFiles = room_data.file_Ids?.slice();
                const newFiles = file_Ids.slice();

                let allFiles: string[];
                if (prevFiles && newFiles) {
                    allFiles = [...prevFiles, ...newFiles];
                } else if (newFiles && !prevFiles) {
                    allFiles = newFiles;
                } else if (!newFiles && prevFiles) {
                    allFiles = prevFiles;
                } else {
                    allFiles = [];
                }
                const uniqueFiles = removeDuplicates(allFiles);
                const room_data_to_be_stored: storedRoomData = {
                    room_Id: room.id,
                    file_Ids: uniqueFiles
                };
                newRoomData.push(room_data_to_be_stored);
            } else if (project_Ids?.length && !file_Ids?.length) {
                // this is a project subscription we will have both files and project ids
                // 6 - this is for project subscription
                // 7 - previous data into inside this rooms data for same webhook/event

                const prevProjects = room_data.project_Ids?.slice();
                const newProjects = project_Ids.slice();

                let allProjects: string[];
                if (prevProjects && newProjects) {
                    allProjects = [...prevProjects, ...newProjects];
                } else if (newProjects && !prevProjects) {
                    allProjects = newProjects;
                } else if (!newProjects && prevProjects) {
                    allProjects = prevProjects;
                } else {
                    allProjects = [];
                }

                const prevFiles = room_data.file_Ids?.slice();
                const newFiles = file_Ids?.slice();

                let allFiles: string[];
                if (prevFiles && newFiles) {
                    allFiles = [...prevFiles, ...newFiles];
                } else if (newFiles && !prevFiles) {
                    allFiles = newFiles;
                } else if (!newFiles && prevFiles) {
                    allFiles = prevFiles;
                } else {
                    allFiles = [];
                }
                // now remove duplicates
                const uniqueFiles = removeDuplicates(allFiles);
                const uniqueProjects = removeDuplicates(allProjects);
                // now store this data
                const room_data_to_be_stored: storedRoomData = {
                    room_Id: room.id,
                    project_Ids: uniqueProjects,
                    file_Ids: uniqueFiles
                };
                newRoomData.push(room_data_to_be_stored);
            }

            subscriptionStorage
                .updateSubscriptionByTeamId(
                    newRoomData,
                    subscription.team_id,
                    subscription.event_name,
                    subscription.webhook_id,
                    user.id
                )
                .then((res) => {
                    console.log(' do: updated subscription');
                    return { success: true };
                })
                .catch((err) => {
                    console.log(
                        'error: updating subscription for new room - ',
                        err
                    );
                    return { success: false };
                });
        } else {
             // 5 -user passed event did not match to the current event on which we are so we dont do anything
            return { success: true };
        }
    } else {
        // current room id did not match to stored room id because the user want to subscribe from a different room'
        if (user_passed_event_type_arr.includes(subscription.event_name)) {
            // 5 - storing user passed event matched to stored event of subscription for new room
            const newRoomData: storedRoomData[] = [
                ...subscription.room_data,
                {
                    room_Id: room.id,
                    project_Ids: project_Ids,
                    file_Ids: file_Ids
                }
            ];
            // 6 - the new room data which should contain prev room data also
            subscriptionStorage
                .updateSubscriptionByTeamId(
                    newRoomData,
                    subscription.team_id,
                    subscription.event_name,
                    subscription.webhook_id,
                    user.id
                )
                .then((res) => {
                    console.log(
                        'pending: updated subscription and added new room - ',
                        res
                    );
                    return { success: true };
                })
                .catch((err) => {
                    {
                        console.log(
                            'error updating subscription for new room - ',
                            err
                        );
                        return { success: false };
                    }
                });
        } else {
            //this subscription event user don't want to subscribe see here
            // 5 - in the new subscription user does not want to subscribe to this event but still we are creating the record
            const newRoomData: storedRoomData[] = [
                ...subscription.room_data,
                {
                    room_Id: room.id
                }
            ];
            // 6 - the new room data which should contain prev room data also but only room id for this room to be consistent
            subscriptionStorage
                .updateSubscriptionByTeamId(
                    newRoomData,
                    subscription.team_id,
                    subscription.event_name,
                    subscription.webhook_id,
                    user.id
                )
                .then((res) => {
                    console.log(
                        'pending: updated subscription for event not subscribed - ',
                        res
                    );
                    return { success: true };
                })
                .catch((err) => {
                    console.log(
                        'error: updating subscription for event not subscribed- ',
                        err
                    );
                    return { success: false };
                });
            // todo: so here is a big problem we are storing a new record inside room_data array without any project or file id because the user wants for some other event we are storing for all the events, here iam doing this because in addNewFileSubscription we have done that. So to use less storage space write the code so that we do not store room id there for the event not subscribed and same here.
        }
    }
    return { success: true };
}
