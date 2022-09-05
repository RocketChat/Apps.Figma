import {IPersistence,
	IRead,} from '@rocket.chat/apps-engine/definition/accessors';
import {RocketChatAssociationModel,
	RocketChatAssociationRecord,} from '@rocket.chat/apps-engine/definition/metadata';
import {IAuthData,} from '@rocket.chat/apps-engine/definition/oauth2/IOAuth2';
import {IUser} from '@rocket.chat/apps-engine/definition/users';
import { IFigmaUserData } from '../definition';
import { NewIUser } from '../definition';

const assoc = new RocketChatAssociationRecord(
	RocketChatAssociationModel.MISC,
	'users',
);

export async function create(
	read: IRead,
	persistence: IPersistence,
	user: IUser,
	userData: IAuthData,
	figmaData: IFigmaUserData
): Promise<void> {
	const users = await getAllUsers(read);
	const figmaUserId = figmaData.id; // store figma user id to retrieve later to tag person when he/she is mentioned in a comment

	if (!users) {
		await persistence.createWithAssociation([{
			...user, figmaUserId: figmaUserId
		}], assoc);
		return;
	}

	if (!isUserPresent(users, {
		...user, figmaUserId: figmaUserId
	})) {
		users.push({
			...user, figmaUserId: figmaUserId
		});
		console.log('user was not present in db, adding to db');
		await persistence.updateByAssociation(assoc, users);
	} else {
		console.log('user was already present in db');
	}
}

export async function remove(
	read: IRead,
	persistence: IPersistence,
	user: NewIUser,
): Promise<void> {
	const users = await getAllUsers(read);

	if (!users || !isUserPresent(users, user)) {
		return;
	}

	const idx = users.findIndex((u: NewIUser) => u.id === user.id);
	users.splice(idx, 1);
	await persistence.updateByAssociation(assoc, users);
}

export async function getAllUsers(read: IRead): Promise<NewIUser[]> {
	const data = await read.getPersistenceReader().readByAssociation(assoc);
	return data.length ? (data[0] as NewIUser[]) : [];
}

{/*
* Returns true if the provided value is present in the array.
* @param users - The array to search in.
* @param  targetUser - The value to search for.
*/ }

function isUserPresent(users: NewIUser[], targetUser: NewIUser): boolean {
	return users.some(user => user.id === targetUser.id);
}

export async function getAccessTokenForUser(
	read: IRead,
	user: NewIUser,
): Promise<IAuthData | undefined> {
	const associations = [
		new RocketChatAssociationRecord(
			RocketChatAssociationModel.USER,
			user.id,
		),
		new RocketChatAssociationRecord(
			RocketChatAssociationModel.MISC,
			'figma-oauth-connection',
		),
	];
	const [result] = (await read
		.getPersistenceReader()
		.readByAssociations(associations)) as unknown as Array<
	IAuthData | undefined
	>;

	return result;
}
