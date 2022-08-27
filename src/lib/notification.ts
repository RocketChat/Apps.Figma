import {IPersistence,
	IRead,} from '@rocket.chat/apps-engine/definition/accessors';
import {RocketChatAssociationModel,
	RocketChatAssociationRecord,} from '@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations';
import {IUser} from '@rocket.chat/apps-engine/definition/users/IUser';

type INotificationsStatus = {
	status: boolean;
};

export class NotificationsController {
	private readonly read: IRead;
	private readonly persistence: IPersistence;
	private readonly association: RocketChatAssociationRecord;
	private readonly userAssociation: RocketChatAssociationRecord;

	constructor(read: IRead, persistence: IPersistence, user: IUser) {
		this.read = read;
		this.persistence = persistence;
		this.association = new RocketChatAssociationRecord(
			RocketChatAssociationModel.MISC,
			'figma-notifications',
		);

		this.userAssociation = new RocketChatAssociationRecord(
			RocketChatAssociationModel.USER,
			user.id,
		);
	}

	public async getNotificationsStatus(): Promise<INotificationsStatus> {
		const [record] = await this.read
			.getPersistenceReader()
			.readByAssociations([this.association, this.userAssociation]);
		return record as INotificationsStatus;
	}

	public async setNotificationsStatus(status: boolean): Promise<boolean> {
		await this.persistence.createWithAssociations({
			status
		}, [
			this.association,
			this.userAssociation,
		]);
		return status;
	}

	// This function updates the user's notification status in the database and returns the new status (true or false)
	public async updateNotificationsStatus(status: boolean) {
		const notificationsStatus = await this.getNotificationsStatus();
		if (!notificationsStatus) {
			return this.setNotificationsStatus(status);
		}

		await this.persistence.updateByAssociations(
			[this.association, this.userAssociation],
			{
				status
			},
		);

		return status;
	}

	public async deleteNotifications(): Promise<void> {
		await this.persistence.removeByAssociations([
			this.association,
			this.userAssociation,
		]);
	}
}
