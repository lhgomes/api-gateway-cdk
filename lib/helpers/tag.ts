import * as cdk from 'aws-cdk-lib';

export class TagHelper {
	public static setTags(taskManager: cdk.TagManager, tags?: Map<string, string>) { 
		taskManager.setTag('OWNER', 'FAB9386');
        if(tags) {
            tags.forEach((value, key) => {
                taskManager.setTag(key, value);
            });
        }
	}
}