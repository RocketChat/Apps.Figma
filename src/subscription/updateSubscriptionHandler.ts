import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { storedRoomData } from '../definition';
export async function updateSubscriptionHandler(
	room: IRoom,
	user: IUser,
	room_data,
	event_type,
	subscription,
	project_Ids,
	file_Ids,
	subscriptionStorage
) {
	if (room_data.room_Id === room.id) {
		// room id will be unique for every object inside room_data
		if (
			event_type.includes(subscription.event_name) &&
            room_data.project_Ids
		) {
			console.log('4');
			const newRoomData: storedRoomData[] = [];
			if (project_Ids) {
				for (const project_id of room_data.project_Ids) {
					// now the room id is there update its project ids if they exist with the passed project ids
					if (project_Ids.includes(project_id)) {
						newRoomData.push({
							room_Id: room.id,
							project_Ids: project_Ids,
							file_Ids: room_data.file_Ids!
						});
					}
				}
			} else if (file_Ids) {
				for (const file_id of room_data.file_Ids!) {
					// the room id is there update its file ids if they exist with the passed file ids
					if (file_Ids.includes(file_id)) {
						newRoomData.push({
							room_Id: room.id,
							project_Ids: room_data.project_Ids!,
							file_Ids: file_Ids
						});
					}
				}
			} else {
				console.log('file_ids and Project_ids array are undefined');
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
					console.log('updated subscription - ', res);
					return;
				})
				.catch((err) =>{
					console.log(
						'error updating subscription for existing room - ',
						err
					);
					return;
				});
		} else {
			// if event type is not passed by user then remove this room id from the room data as user don't want to subscribe for that event
			const newRoomData: storedRoomData[] = [
				{
					room_Id: room.id,
					project_Ids: room_data.project_Ids,
					file_Ids: room_data.file_Ids
				}
			];
			subscriptionStorage
				.updateSubscriptionByTeamId(
					newRoomData,
					subscription.team_id,
					subscription.event_name,
					subscription.webhook_id,
					user.id
				)
				.then((res) => console.log('for new room - ', res))
				.catch((err) =>
					console.log(
						'error updating subscription for new room - ',
						err
					)
				);
		}
	} else {
		// create a new subscription as it previously did not exist
		if (event_type.includes(subscription.event_name)) {
			const newRoomData: storedRoomData[] = [
				...subscription.room_data,
				{
					room_Id: room.id,
					project_Ids: project_Ids,
					file_Ids: file_Ids
				}
			];
			console.log('3 - room did not exist previously so ');
			subscriptionStorage
				.updateSubscriptionByTeamId(
					newRoomData,
					subscription.team_id,
					subscription.event_name,
					subscription.webhook_id,
					user.id
				)
				.then((res) =>
					console.log('updated subscription for new room - ', res)
				)
				.catch((err) =>
					console.log(
						'error updating subscription for new room - ',
						err
					)
				);
		} else {
			//this subscription event user dont want to subscribe see here
			console.log(
				'this subscription event user dont want to subscribe to',
				subscription.event_name
			);
		}
	}
}
