import {IHttp} from '@rocket.chat/apps-engine/definition/accessors';
import {IUser} from '@rocket.chat/apps-engine/definition/users';
import {FigmaApp} from '../../FigmaApp';
import {IApiEndpointMetadata} from '@rocket.chat/apps-engine/definition/api';
const crypto = require('crypto');

const BaseFileHost = 'https://www.figma.com/file/';
const BaseTeamHost = 'https://www.figma.com/files/team/';
const BaseProjectHost = 'https://www.figma.com/files/project/';
const BaseApiHost = 'https://www.figma.com/api';

const passcode = crypto.randomBytes(48).toString('hex');

// FigmaSDK class contains all the methods to interact with figma API

// file url example - https://www.figma.com/file/b0l0lp73g04EgbqDeNiHh4/file-2
export function getFileName(fileURL: string): string {
	if (!fileURL.startsWith(BaseFileHost)) {
		return '';
	}

	const apiUrl = fileURL.substring(BaseFileHost.length);
	const fileName = apiUrl.split('/')[1].split('?')[0];
	return fileName;
}

// File url - https://www.figma.com/file/f6dNpg1iG3KXgy4BpPaKMK/Twitter-Content?node-id=0%3A1
export function getFileID(fileURL: string): string {
	if (!fileURL.startsWith(BaseFileHost)) {
		return '';
	}

	const apiUrl = fileURL.substring(BaseFileHost.length);
	const fileID = apiUrl.split('/')[0];
	return fileID;
}

export function getTeamID(teamURL: string): string {
	if (!teamURL.startsWith(BaseTeamHost)) {
		return '';
	}

	const id = teamURL.substring(BaseTeamHost.length).split('/')[0];
	const teamID = id;
	return teamID;
}

// Project url - https://www.figma.com/files/project/53807385/project1?fuid=983416835186317142
export function getProjectID(teamURL: string): string {
	if (!teamURL.startsWith(BaseProjectHost)) {
		return '';
	}

	const id = teamURL.substring(BaseProjectHost.length).split('/')[0];
	const projectID = id;
	return projectID;
}

export async function getWebhookUrl(app: FigmaApp): Promise<string> {
	const accessors = app.getAccessors();
	const webhookEndpoint = accessors.providedApiEndpoints.find(
		endpoint => endpoint.path === 'figmawebhook',
	)!;
	let siteUrl: string = (await accessors.environmentReader
		.getServerSettings()
		.getValueById('Site_Url')) as string;
	if (siteUrl.endsWith('/')) {
		siteUrl = siteUrl.substring(0, siteUrl.length - 1);
	}

	return siteUrl + webhookEndpoint.computedPath;
}
