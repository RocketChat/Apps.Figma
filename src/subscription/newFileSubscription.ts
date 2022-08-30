export async function newFileSubscription(
	useSentEvent,
	file_Ids,
	response,
	team_id,
	user,
	subscriptionStorage,
	room,

) {
	let projects_to_be_stored: string[] | undefined;
	let files_to_be_stored: string[] | undefined;

	if (useSentEvent === event) {
		console.log('📁 subscription for file called');
		files_to_be_stored = file_Ids;
		return await subscriptionStorage.storeSubscriptionByEvent(
			'subscription',
			response.data.id,
			team_id,
			room,
			user,
			event,
			projects_to_be_stored,
			files_to_be_stored,
		);

	} else {
		return await subscriptionStorage.storeSubscriptionByEvent(
			'subscription',
			response.data.id,
			team_id,
			room,
			user,
			event,
			projects_to_be_stored,
			files_to_be_stored,
		);
	}


}
