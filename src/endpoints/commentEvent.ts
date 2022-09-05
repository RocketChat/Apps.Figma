import { sendMessage } from '../lib/messages';

export async function commentEvent (room, roomData, user, payload, modify, comment) {
	if (room) {
		if ((!roomData.project_Ids || roomData.project_Ids.length == 0) && (roomData.file_Ids || roomData.file_Ids!.length > 0)) {
			console.log('roomData has files init - ', roomData);
			if (roomData.file_Ids!.includes(payload.file_key)) {
				const message = `${payload.triggered_by.handle} commented on ${payload.file_name} - ${comment}`;
				await sendMessage(
					modify,
					room,
					user,
					message
				);
			}

		} else if ((!roomData.file_Ids || roomData.file_Ids.length == 0) && (roomData.project_Ids || roomData.project_Ids!.length > 0)) {
			console.log('roomData has projects init - ', roomData);
			// files does not exist this means that there are projects in the room then if the project is present send the message to the room
			// for project we will have to store all the files we are getting from that project and then check if the file is present in the files array
			if (roomData.file_Ids?.includes(payload.file_key)) {
				const message = `${payload.triggered_by.handle} commented on ${payload.file_key} - ${comment}`;
				await sendMessage(
					modify,
					room,
					user,
					message
				);
			}

		} else if (!roomData.file_Ids && !roomData.project_Ids) {
			console.log('roomData has no files or projects init - ', roomData);
			// both project ids and file ids array are undefined which means subscription is for the whole team
		}

	} else {
		console.log('Figma pinged but room not found - ', roomData);
	}
}
