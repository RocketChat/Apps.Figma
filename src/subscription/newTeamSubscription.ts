// create a function called as newProjectSubscription

export async function newTeamSubscription(
	room,
	accessToken,
	team_id,
	subscriptionStorage,
	user
) {
	let projects_to_be_stored: string[] | undefined;
	let files_to_be_stored: string[] | undefined;

	console.log('👨‍👨‍👦‍👦 team subscription');
	// todo : create a different file for sending request
	this.http
		.get(`https://api.figma.com/v1/teams/${team_id}/projects`, {
			headers: {
				Authorization: `Bearer ${accessToken?.token}`
			}
		})
		.then(async (response) => {
			// we got the response of all the projects from figma now we will have to store them inside in project_Ids array
			projects_to_be_stored = response.data.projects.map(
				(project) => project.id
			);
			return await subscriptionStorage.storeSubscriptionByEvent(
				'subscription',
				response.data.id,
				team_id,
				room,
				user,
				event,
				projects_to_be_stored,
				files_to_be_stored
			);
		});
}
