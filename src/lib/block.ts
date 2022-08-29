import {IModify} from '@rocket.chat/apps-engine/definition/accessors';
import {BlockBuilder} from '@rocket.chat/apps-engine/definition/uikit';

export type IButton = {
	text: string;
	url?: string;
	actionId?: string;
};

export async function createSectionBlock(
	modify: IModify,
	sectionText: string,
	button?: IButton | undefined,
	buttonGroup?: IButton[] | undefined,
): Promise<BlockBuilder> {
	const blocks = modify.getCreator().getBlockBuilder();

	blocks.addSectionBlock({
		text: blocks.newMarkdownTextObject(sectionText)
	});

	if (button) {
		blocks.addActionsBlock({
			elements: [
				blocks.newButtonElement({
					actionId: button.actionId,
					text: blocks.newPlainTextObject(button.text),
					url: button.url,
				}),
			],
		});
	} else if (buttonGroup) {
		blocks.addActionsBlock({
			elements: buttonGroup.map((button) => {
				return blocks.newButtonElement({
					actionId: button.actionId,
					text: blocks.newPlainTextObject(button.text),
					url: button.url,
				});
			}),
		});
	}


	return blocks;
}
