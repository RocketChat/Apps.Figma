import {IHttp} from '@rocket.chat/apps-engine/definition/accessors';

const BaseHost = 'https://figmab.com/';
const BaseApiHost = 'https://api.figma.com/v2/';

async function postRequest(
	http: IHttp,
	accessToken: string,
	url: string,
	data: any,
): Promise<any> {
	const response = await http.post(url, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json',
			'User-Agent': 'Rocket.Chat-Apps-Engine',
		},
		data,
	});
	// If it isn't a 2xx code, something wrong happened
	if (!response.statusCode.toString().startsWith('2')) {
		throw response;
	}

	return JSON.parse(response.content || '{}');
}

{
	/*
Async function deleteRequest(
    http: IHttp,
    accessToken: String,
    url: string
): Promise<any> {
    const response = await http.del(url, {
        headers: {
            Authorization: `token ${accessToken}`,
            "Content-Type": "application/json",
            "User-Agent": "Rocket.Chat-Apps-Engine",
        },
    });

    // If it isn't a 2xx code, something wrong happened
    if (!response.statusCode.toString().startsWith("2")) {
        throw response;
    }

    return JSON.parse(response.content || "{}");
}
*/
}

async function patchRequest(
	http: IHttp,
	accessToken: string,
	url: string,
	data: any,
): Promise<any> {
	const response = await http.patch(url, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json',
			'User-Agent': 'Rocket.Chat-Apps-Engine',
		},
		data,
	});

	// If it isn't a 2xx code, something wrong happened
	if (!response.statusCode.toString().startsWith('2')) {
		throw response;
	}

	return JSON.parse(response.content || '{}');
}

export async function createSubscription(
	http: IHttp,
	team_id: string,
	webhookUrl: string,
	access_token: string,
	event_type: string[],
) {
	return postRequest(http, access_token, BaseApiHost + '/webhooks', {
		event_type,
		team_id,
		endpoint: webhookUrl,
		passcode: '123456789',
	});
}

