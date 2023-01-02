// ? Create a array buffer for CPU memory
const createMemory = (sizeInBytes) => {
	const arrayBuffer = new ArrayBuffer(sizeInBytes);
	const dataView = new DataView(arrayBuffer);
	return dataView;
};

module.exports = createMemory;
