export class Utility {
    static makeString(): string {
		let outString: string = '';
		const CHARSET = 'abcdefghijklmnopqrstuvwxyz0123456789';

		for (let i = 0; i < 32; i++) {
			outString += CHARSET[Math.floor(Math.random() * CHARSET.length)];
		}

		return outString;
	}
}