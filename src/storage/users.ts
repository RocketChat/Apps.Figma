import {
    IPersistence,
    IRead
} from '@rocket.chat/apps-engine/definition/accessors';
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord
} from '@rocket.chat/apps-engine/definition/metadata';
import { IAuthData } from '@rocket.chat/apps-engine/definition/oauth2/IOAuth2';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { IFigmaUserData } from '../definition';
import { NewIUser } from '../definition';

const assoc = new RocketChatAssociationRecord(
    RocketChatAssociationModel.MISC,
    'users'
);

/**
 * Returns all users from the database
 * @param read - accessor to the environment
 * @param persistence
 * @param user - user to be added
 * @param userData - user data
 * @param figmaData - user data from figma
 */
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
        await persistence.createWithAssociation(
            [
                {
                    ...user,
                    figmaUserId: figmaUserId
                }
            ],
            assoc
        );
        return;
    }

    if (
        !isUserPresent(users, {
            ...user,
            figmaUserId: figmaUserId
        })
    ) {
        users.push({
            ...user,
            figmaUserId: figmaUserId
        });
        await persistence.updateByAssociation(assoc, users);
    } else {
        console.log('error: user was already present in db');
    }
}

/**
 * Returns all users from the database
 * @param read - accessor to the environment
 * @param persistence - persistance to the environment
 * @param user - user to be removed
 */
export async function remove(
    read: IRead,
    persistence: IPersistence,
    user: NewIUser
): Promise<void> {
    const users = await getAllUsers(read);

    if (!users || !isUserPresent(users, user)) {
        return;
    }

    const idx = users.findIndex((u: NewIUser) => u.id === user.id);
    users.splice(idx, 1);
    await persistence.updateByAssociation(assoc, users);
}


/**
 * Returns all users from the database
 * @param read - accessor to the environment
 */
export async function getAllUsers(read: IRead): Promise<NewIUser[]> {
    const data = await read.getPersistenceReader().readByAssociation(assoc);
    return data.length ? (data[0] as NewIUser[]) : [];
}

/**
 * Returns true if the provided value is present in the array.
 * @param users - The array to search in.
 * @param  targetUser - The value to search for.
 */

function isUserPresent(users: NewIUser[], targetUser: NewIUser): boolean {
    return users.some((user) => user.id === targetUser.id);
}

/**
 * This function needed to be copied from the apps engine due to difficulties trying to
 * get access to the auth client from inside a job processor.
 * @NOTE It relies on hardcoded information (config alias's suffix) to work and it might break if
 * the value changes
 */
export async function getAccessTokenForUser(
    read: IRead,
    user: NewIUser
): Promise<IAuthData | undefined> {
    const associations = [
        new RocketChatAssociationRecord(
            RocketChatAssociationModel.USER,
            user.id
        ),
        new RocketChatAssociationRecord(
            RocketChatAssociationModel.MISC,
            'figma-oauth-connection'
        )
    ];
    const [result] = (await read
        .getPersistenceReader()
        .readByAssociations(associations)) as unknown as Array<
        IAuthData | undefined
    >;

    return result;
}
