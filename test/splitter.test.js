const Splitter = artifacts.require("./Splitter.sol");

const assertRevert = require("./test.util").assertRevert;
const inLogs = require("./test.util").inLogs;

const { toBN } = web3.utils;

contract("Splitter", ([base, another, yetAnother]) => {
	const ZERO_ADDRESS = "0x" + "0".repeat(40);
	let sut;

	before(() => {
		web3.eth.defaultAccount = base;
	});

	beforeEach("Instantiate Splitter", async () => {
		sut = await Splitter.new();
	});

	describe("Split tests", () => {
		it("split Should revert When passed more than max recipients.", async () => {
			// Arrange
			const recipients = new Array(129).fill(another);
			// Act
			const result = sut.split(recipients, { from: base, value: 1025 });
			// Assert
			await assertRevert(result, "Passed len greater than _recipients max len.");
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
			await inLogs(logs, "Split", { "from": base, "share": toBN(1) });
		});

		it("split Should send exact shares to all recipients When passed valid arguments.", async () => {
			// Arrange
			const anotherPreviousBalance = await sut.balanceOf(another);
			const yetAnotherPreviousBalance = await sut.balanceOf(yetAnother);
			// Act
			await sut.split([another, yetAnother], { from: base, value: 2 });
			// Assert
			const anotherNewBalance = await sut.balanceOf(another);
			const yetAnotherNewBalance = await sut.balanceOf(yetAnother);

			assert.equal(anotherPreviousBalance.add(toBN(1)).toString(), anotherNewBalance);
			assert.equal(yetAnotherPreviousBalance.add(toBN(1)).toString(), yetAnotherNewBalance);
		});

		it("split Should send back tip to msg.sender When passed not exact amount to split.", async () => {
			// Arrange
			const previousBalance = await sut.balanceOf(base);
			const expectedTip = toBN(1);
			const splitAmount = toBN(3);

			// Act
			await sut.split([another, yetAnother], { from: base, value: splitAmount });

			// Assert
			const newBalance = await sut.balanceOf(base);

			const expectedBalance = previousBalance
				.add(expectedTip);

			assert.equal(expectedBalance.toString(), newBalance.toString());
		});

		it("split Should split shares successfully When passed zero address as recipient.", async () => {
			// Arrange
			const previousBalance = await sut.balanceOf(another);
			const expectedShare = toBN(1);
			const splitAmount = toBN(2);

			// Act
			await sut.split([ZERO_ADDRESS, another], { from: base, value: splitAmount });

			// Assert
			const newBalance = await sut.balanceOf(another);

			const expectedBalance = previousBalance
				.add(expectedShare);

			assert.equal(expectedBalance.toString(), newBalance.toString());
		});

		it("split Should send back tip to msg.sender When passed zero address as recipient.", async () => {
			// Arrange
			const previousBalance = await sut.balanceOf(base);
			const expectedTip = toBN(1);
			const splitAmount = toBN(2);

			// Act
			await sut.split([ZERO_ADDRESS, another], { from: base, value: splitAmount });

			// Assert
			const newBalance = await sut.balanceOf(base);

			const expectedBalance = previousBalance
				.add(expectedTip);

			assert.equal(expectedBalance.toString(), newBalance.toString());
		});
	});

	describe("Withdraw tests", () => {
		const splitAmount = toBN(1);
		const withdrawalAmount = toBN(1);

		it("withdraw Should revert When msg sender has insufficient balance.", async () => {
			// Arrange
			// Act
			const result = sut.withdraw(withdrawalAmount, { from: another });

			// Assert
			await assertRevert(result, "Your balance is insufficient.");
		});

		it("withdraw Should subtract exact amount from msg sender balance When passed valid arguments.", async () => {
			// Arrange
			await sut.split([another], { from: base, value: splitAmount });

			const previousBalance = await sut.balanceOf(another);

			// Act
			await sut.withdraw(withdrawalAmount, { from: another });

			// Assert
			const newBalance = await sut.balanceOf(another);

			const expectedBalance = previousBalance
				.sub(withdrawalAmount);

			assert.equal(expectedBalance.toString(), newBalance.toString());
		});

		it("withdraw Should emit Withdrawal event with exact values When passed valid arguments.", async () => {
			// Arrange
			await sut.split([another], { from: base, value: splitAmount });

			// Act
			const { logs } = await sut.withdraw(withdrawalAmount, { from: another });

			// Assert
			await inLogs(logs, "Withdrawal", { "recipient": another, "amount": withdrawalAmount });
		});

		it("withdraw Should transfer exact amount to msg sender When passed valid arguments.", async () => {
			// Arrange
			await sut.split([another], { from: base, value: splitAmount });

			const previousBalance = toBN(await web3.eth.getBalance(another));
			const gasPrice = toBN(await web3.eth.getGasPrice());

			// Act
			const tx = await sut.withdraw(withdrawalAmount, { from: another, gasPrice: gasPrice });

			// Assert
			const newBalance = toBN(await web3.eth.getBalance(another));
			const gasConsumption = toBN(tx.receipt.gasUsed).mul(gasPrice);

			const expectedBalance = previousBalance
				.sub(gasConsumption)
				.add(withdrawalAmount);

			assert.equal(expectedBalance.toString(), newBalance.toString());
		});
	});
});