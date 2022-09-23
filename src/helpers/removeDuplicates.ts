export function removeDuplicates(arr: string[]) {
	const unique: string[] = [];
	arr.forEach((element: string) => {
		if (!unique.includes(element)) {
			unique.push(element);
		}
	});
	return unique;
}
