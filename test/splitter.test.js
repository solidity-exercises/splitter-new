const Splitter = artifacts.require("./fakes/Splitter.sol");

const assertRevert = require("./test.util").assertRevert;
const inLogs = require("./test.util").inLogs;

contract("Splitter", ([base, another, yetAnother]) => {
	const ZERO_ADDRESS = "0x" + "0".repeat(40);
	let sut;

	before(() => {
		web3.eth.defaultAccount = base;
	});

	beforeEach(async () => {
		sut = await Splitter.new();
	});

	it("split Should revert When passed more than max recipients.", async () => {
		// Arrange
		const recipients = new Array(1025).fill(another);
		// Act
		const result = sut.split(recipients, { from: base, value: 1025 });
		// Assert
		await assertRevert(result, "Passed len greater than recipients max len.");
	});

	it("split Should revert When passed zero msg value.", async () => {
		// Arrange
		// Act
		const result = sut.split([another, yetAnother], { from: base, value: 0 });
		// Assert
		await assertRevert(result, "Zero value split not allowed.");
	});

	it("split Should emit Split event with exact values When passed valid arguments.", async () => {
		// Arrange
		// Act
		const { logs } = await sut.split([another, yetAnother], { from: base, value: 2 });
		// Assert
		await inLogs(logs, "Split", { "from": base, "share": web3.utils.toBN(1) });
	});

	it("split Should send exact shares to all recipients When passed valid arguments.", async () => {
		// Arrange
		const previousBalances = await Promise.all([web3.eth.getBalance(another), web3.eth.getBalance(yetAnother)]);
		// Act
		await sut.split([another, yetAnother], { from: base, value: 2 });
		// Assert
		const newBalances = await Promise.all([web3.eth.getBalance(another), web3.eth.getBalance(yetAnother)]);

		assert.equal(Number(previousBalances[0]) + 1, Number(newBalances[0]));
		assert.equal(Number(previousBalances[1]) + 1, Number(newBalances[1]));
	});

	it("split Should send back tip to msg.sender When passed not exact amount to split.", async () => {
		// Arrange
		const previousBalance = web3.utils.toBN(await web3.eth.getBalance(base));
		const gasPrice = web3.utils.toBN(await web3.eth.getGasPrice());
		const expectedTip = web3.utils.toBN(1);
		const splitAmount = web3.utils.toBN(3);

		// Act
		const tx = await sut.split([another, yetAnother], { from: base, value: splitAmount });

		// Assert
		const newBalance = web3.utils.toBN(await web3.eth.getBalance(base));

		const gasConsumption = web3.utils.toBN(tx.receipt.cumulativeGasUsed).mul(web3.utils.toBN(gasPrice));

		// previousBalance - gasConsumption - split + tip
		const expectedBalance = previousBalance
			.sub(gasConsumption)
			.sub(splitAmount)
			.add(expectedTip);

		assert.equal(expectedBalance.toString(), newBalance.toString());
	});

	it("split Should split shares successfully When passed zero address as recipient.", async () => {
		// Arrange
		const previousBalance = web3.utils.toBN(await web3.eth.getBalance(another));
		const expectedShare = web3.utils.toBN(1);
		const splitAmount = web3.utils.toBN(2);

		// Act
		await sut.split([ZERO_ADDRESS, another], { from: base, value: splitAmount });

		// Assert
		const newBalance = web3.utils.toBN(await web3.eth.getBalance(another));

		const expectedBalance = previousBalance
			.add(expectedShare);

		assert.equal(expectedBalance.toString(), newBalance.toString());
	});

	it("split Should send back tip to msg.sender When passed zero address as recipient.", async () => {
		// Arrange
		const previousBalance = web3.utils.toBN(await web3.eth.getBalance(base));
		const gasPrice = web3.utils.toBN(await web3.eth.getGasPrice());
		const expectedTip = web3.utils.toBN(1);
		const splitAmount = web3.utils.toBN(2);

		// Act
		const tx = await sut.split([ZERO_ADDRESS, another], { from: base, value: splitAmount });

		// Assert
		const newBalance = web3.utils.toBN(await web3.eth.getBalance(base));

		const gasConsumption = web3.utils.toBN(tx.receipt.cumulativeGasUsed).mul(web3.utils.toBN(gasPrice));

		// previousBalance - gasConsumption - split + tip
		const expectedBalance = previousBalance
			.sub(gasConsumption)
			.sub(splitAmount)
			.add(expectedTip);

		assert.equal(expectedBalance.toString(), newBalance.toString());
	});
});