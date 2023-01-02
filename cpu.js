const createMemory = require('./create-memory');
const instructions = require('./instructions');

class CPU {
	constructor(memory) {
		this.memory = memory;

		this.registerNames = [
			'instructionPointer',
			'accumulator',
			'register1',
			'register2',
			'register3',
			'register4',
			'register5',
			'register6',
			'register7',
			'register8',
		];

		this.registers = createMemory(this.registerNames.length * 2);

		this.registerMap = this.registerNames.reduce((map, name, i) => {
			map[name] = i * 2;
			return map;
		}, {});
	}

	debug() {
		console.log();
		this.registerNames.forEach((name) => {
			console.log(`${name}: ${this.getRegister(name).toString(16).padStart(4, '0')}`);
		});
		console.log();
	}

	viewMemoryAt(address) {
		const nextEightBytes = Array.from({ length: 8 }, (_, i) => this.memory.getUint8(address + i)).map(
			(v) => `0x${v.toString(16).padStart(2, '0')}`
		);

		console.log(`0x${address.toString(16).padStart(4, '0')}: ${nextEightBytes.join(' ')}`);
	}

	getRegister(name) {
		if (!(name in this.registerMap)) {
			throw new Error(`getRegister: No such register '${name}'`);
		}
		return this.registers.getUint16(this.registerMap[name]);
	}

	setRegister(name, value) {
		if (!(name in this.registerMap)) {
			throw new Error(`setRegister: No such register '${name}'`);
		}
		return this.registers.setUint16(this.registerMap[name], value);
	}

	fetch() {
		const nextInstructionAddress = this.getRegister('instructionPointer');
		const instruction = this.memory.getUint8(nextInstructionAddress);
		this.setRegister('instructionPointer', nextInstructionAddress + 1);
		return instruction;
	}

	fetch16() {
		const nextInstructionAddress = this.getRegister('instructionPointer');
		const instruction = this.memory.getUint16(nextInstructionAddress);
		this.setRegister('instructionPointer', nextInstructionAddress + 2);
		return instruction;
	}

	execute(instruction) {
		switch (instruction) {
			// ? Move literal value into register
			case instructions.MOV_LIT_REG: {
				const literal = this.fetch16();
				const register = (this.fetch() % this.registerNames.length) * 2;
				this.registers.setUint16(register, literal);
				return;
			}

			// ? Move register value into register
			case instructions.MOV_REG_REG: {
				const registerFrom = (this.fetch() % this.registerNames.length) * 2;
				const registerTo = (this.fetch() % this.registerNames.length) * 2;
				const value = this.registers.getUint16(registerFrom);
				this.registers.setUint16(registerTo, value);
				return;
			}

			// ? Move register value into memory
			case instructions.MOV_REG_MEM: {
				const registerFrom = (this.fetch() % this.registerNames.length) * 2;
				const address = this.fetch16();
				const value = this.registers.getUint16(registerFrom);
				this.memory.setUint16(address, value);
				return;
			}

			// ? Move memory value into register
			case instructions.MOV_MEM_REG: {
				const address = this.fetch16();
				const registerTo = (this.fetch() % this.registerNames.length) * 2;
				const value = this.memory.getUint16(address);
				this.registers.setUint16(registerTo, value);
				return;
			}

			// ? Move literal value into the register2
			case instructions.MOV_LIT_R2: {
				const literal = this.fetch16();
				this.setRegister('register2', literal);
				return;
			}

			// ? Add two registers values to accumulator
			case instructions.ADD_REG_REG: {
				const register1 = this.fetch();
				const register2 = this.fetch();
				const registerValue1 = this.registers.getUint16(register1 * 2);
				const registerValue2 = this.registers.getUint16(register2 * 2);
				this.setRegister('accumulator', registerValue1 + registerValue2);
				return;
			}

			// ? Jump if not equal
			case instructions.JMP_NOT_EQ: {
				const value = this.fetch16();
				const address = this.fetch16();

				if (value != this.getRegister('accumulator')) {
					this.setRegister('instructionPointer', address);
				}

				return;
			}
		}
	}

	step() {
		const instruction = this.fetch();
		return this.execute(instruction);
	}
}

module.exports = CPU;
