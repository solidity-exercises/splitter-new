const Splitter = artifacts.require("./Splitter.sol");

const { assertRevert, inLogs}  = require("./test.util");
const { toBN } = web3.utils;

contract("Splitter", ([base, another, yetAnother]) => {
	const ZERO_ADDRESS = "0x" + "0".repeat(40);
	let sut;

	beforeEach("Instantiate Splitter", async () => {
		sut = await Splitter.new({ from: base });
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
			const recipients = [another, yetAnother];
			// Act
			const { logs } = await sut.split(recipients, { from: base, value: 2 });
			// Assert
			await inLogs(logs, "Split", { "from": base, "recipients": recipients, "share": toBN(1) });
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

		it("split Should have gas consumption less than the desired one When passed max recipients.", async () => {
			// Arrange
			const desiredGasLimit = 3000000;
			const recipients = ["0xf98ef509679b367270b5256f65d780295e446a16", "0xdfd70e7edd75c09a5c583a8a2eb2188693ebd076", "0x0b44611b8ae632be05f24ffe64651f050402ae01", "0xd90081b7f521c06108cd9a769ad81f232fadcb77", "0xb0ca787f8cf38f077e8201b05378da230a8b462f", "0x8adee42554f6637d68094485f3c344650843da12", "0x9f0f1be08591ab7d990faf910b38ed5d60e4d5bf", "0x0df4734c2c568dfd582c22fa1ebb1b652034c221", "0xf0155486a14539f784739be1c02e93f28eb8e960", "0x3d6f944b00343c3df56cae862a1493da60cb6775", "0xe757d549e4dda38be238156576d70647cdc5ed40", "0x174bfa6600bf90c885c7c01c7031389ed1461ab9", "0xd9100e02ffebc5c15227b283303dd0efc24c7e23", "0xa9ebfaf1a788c3bfcf2a4ec1043a8e66f6c7cb4b", "0x13b76bcf22f4121617cfdd0367753d01ebcd5fff", "0x6271a9c402e0b84d2b41dc04f92b35d69c7c0eb5", "0xab8ba3d221f571002b103277f3b783a72971cbb9", "0x931abd3732f7eada74190c8f89b46f8ba7103d54", "0xd3f4afcbacfd4ef658b013ec1b843203401bccc4", "0xd2bd6415db70a0f0b26c973b15b63bac74f5c9c6", "0xac971d8554e0b25c8372e51fa75a6953cf2a470d", "0xfbecebb7d09d0d71cd60d8c54e3c10fe61c66f20", "0xab44e4ddd42314ab4f10a125b8a832278487d6bb", "0xece64f7d1bf13fdae63512aab0c49b5cf4eef2f3", "0x42adf94f10fba7033a25c12bc5f4737f79cda19c", "0xae8e14fd5cc4c562571dfe2345209fc2a79591e1", "0xb9f56cc89f90892355b2af6e2d44e6f4de9b6d56", "0x3e2a9966e5020cd07f0acde28be4b1bdf22399dd", "0x62eae59989c592cc919b4ddb8564431d0c9ce797", "0x05c05a20d690d53f11725eef8b26b6248977fd6f", "0xe384137f7baffc564265006fd332e5b9adc66864", "0xf07a03310d019f3511a1c227f61fd80ad4ffec1f", "0x72dac6b2b6b5a1bb2527f9824ae7f095b5f36dd3", "0x2eed0e1c622271697d3bbcd1110e2d396bfe284f", "0xc06a0d047a38cb322a19d5ff285df446821ffb79", "0xb55a183bf5db01665f9fc5dfba71fc6f8b5e42e6", "0x136723300aef2aab4b7cf52c3eaac6f997e12a68", "0x1490a77994bd23395fcf098dcd60a7ef2fe82613", "0x000000109099b65ba98f0934ddd9c95e8ea3fd48", "0xa1d5bf22fa3f8154eb8265851fc2d03fe2c5edb1", "0x2ad1f280a8902874eb155381052e4bf4b4835b89", "0x3a966ffa8451cbf3769b7d1f94d5b47da254edb0", "0xbdd036275ffe759e4df1cce8a357576386625cd1", "0x9b6f69dff31d28bad4f5e269916c8b0762e8b7c8", "0x2c33864a98c502f8b50a939b5af1af72e441b940", "0x9f2df004713f8bf9b1daf14566d8c832fc010282", "0xccccccc3b1ac9d2d02ce052917ee92618e9738b9", "0xab5622d7da96c571c6abe08e4b85e462eb666e4f", "0xed9878336d5187949e4ca33359d2c47c846c9dd3", "0x896b516eb300e61cfc96ee1de4b297374e7b70ed", "0x99d2476130728d290253264513ff79a8f006a971", "0x4a2b76d5cb87bab48a14759649bb43ec8a35a628", "0x25c6bf07f3848d146ab24f815cf9a3b1c4a1f27d", "0xabf87ab0158a65bce3d068420d3b9150b39ff62d", "0x8b32631e6260cc0d29986c0821b22be9a26971ae", "0x502a76d02dfaeb9a7907a4e4b28fb66519ba7d60", "0x254ef3fcae7b468e5ae36d55d9ebb1c5dff21e64", "0xcc9f90feea0d0e448f9b527866797c8004872f7f", "0x5b42f2e8c85aeb72171d9afc15f1998841761132", "0xf0b83f6677959a6c517444cd9a498dd75c98defc", "0x6f52354143d84ba7e02274b37662539a1d395920", "0x5bc901cbebefb03a56d45e57e4f356dc4db30ab5", "0x1c3d2d14cb40ee63ba3c56128946a1bac98344c5", "0x21ab6c9fac80c59d401b37cb43f81ea9dde7fe34", "0x66eb5bddb4a615fd97d00402bb26d1c9a79a287f", "0x41e27f7d702abc4f21bb317a43642dae2ac51d65", "0x03b6bf658abc5f435920162cf392dd566a271569", "0xe71efa3ac6895450da7c154576849d5091a86627", "0x5d285f735998f36631f678ff41fb56a10a4d0429", "0x53ede7cae3eb6a7d11429fe589c0278c9acbe21a", "0xf4985070ce32b6b1994329df787d1acc9a2dd9e2", "0x7fd81a88f3915197f0d5a4d84e9448fe3327a131", "0xe761eeec8a4591e1a9514a9a9e897ffa3274aad6", "0x87c74ddd95360a81b6772b8361ce6508ee43fabe", "0xab4e1802c61e12fd7b10a69a226f5d727c76a8aa", "0xcf6b2560ece00eb921e133c119281758d2f7dfd4", "0x22a5adbcd870aa355cc9a756aa56dbf823a62b7c", "0xab0d4d41460a070b37ef494e455e8d6b8595da85", "0xa7ed910e9461341e578663e5df0a324a91ec6ec9", "0xf113fc1ebf8de5e4411fbd72635ac45b9524e09d", "0xfd8aa751679d281b036d4432bec8ada52c08d26d", "0xfe90e7b164bde4b0737fc82eec5dc31b96f7a83e", "0xc496c6dd7bfffe21aeeffca37a6cbf9c80967239", "0x232ee6905191d6b492127e362c965c225031d58a", "0xb96f547da042737c95d7f9397cd86068d0a817a8", "0x149e3083e040efde3b73ed4090ad1f508df068b1", "0x0ad94f4d44a6bb9612773bb1cc37b370b159c2cf", "0xd49d66e13803a615ae583ddec94a24b5be9d8d3a", "0x94fe3ad91dacba8ec4b82f56ff7c122181f1535d", "0x1c17180d9b27e4d2fa78d4e83b4a96a5b60cd673", "0xbe2ea16f6c3b7f32b9d33e6d2189bc1d3b92f04e", "0x3c020e014069df790d4f4e63fd297ba4e1c8e51f", "0x2385c32e07f37fb90eeec1c121ec864465cc47c0", "0x1f973b233f5ebb1e5d7cfe51b9ae4a32415a3a08", "0x00000000c0293c8ca34dac9bcc0f953532d34e4d", "0x62b9b061a78bed50151f3ef7867995e5d119adce", "0x07f0eb0c571b6cfd90d17b5de2cc51112fb95915", "0xa425e4d02de808f584c5141bd7a077a8e2311ef0", "0x07ecab8c04c9bd657439b18112d69badabf11d87", "0xaa61874a6515276d29816aba88028a4f5e9a2707", "0xd31a5afcf4f2168d0e3a47685c85b2166edf69d9", "0x3945476e477de76d53b4833a46c806ef3d72b21e", "0x425372c0ac9d559a186a08a3854e0ddea1a00d5c", "0x6ccd5b774ca41432a8c19ba8397ccfa97e9962e1", "0x7be4ed04b59d01a9a323aa8c785035a5142c95b8", "0xca80c67499da025acf25590ef246cc18a3e6e75b", "0x7c18cfe1a893ea815ea11775b38562bd957fd0dc", "0x42eba0072d557dcfe19d8b3b59a93a62e02d5156", "0x3cba64b5be89cd0a2a0eab613cd8641b689933d1", "0x2e637cba18c3bd17e4b97907bb671669512b507b", "0x6badddfcab01f1be42ce718b88232a06d63de987", "0x17f9e5f767cd056b0a52a0c44d12f395c93946ec", "0x87ac990eba692f34a466b8d34d750aa8b86daebb", "0xae9b8e05c22bae74d1e8db82c4af122b18050bd4", "0x85358d12d26d09e4653af0e023bd2e3a6228639d", "0xf7af09a7424acaaa43acf40ccf90bd62ebed8cfa", "0x5e6824740ccb27d18655390f60de1e7b8a2f08f9", "0x84a78bb71a88f4c7d2f8b3584590682916dd5eff", "0x2a5283380e4bbd35339b06aab87304b3237ff270", "0x51fc7e39af0f8486413e28c87457fd70822dc2e2", "0xccb8d6fb475f312e9d3ec631190b12596a79694d", "0x6229a1d338424ca00f5728491f8cf56d5a852d9e", "0x392eef37866e73d91449dd89d17729ab5d1baf02", "0x3b1f6696191c26b2f823e5467909c1a3aa98f858", "0x9394e0e89709a7d351456e70b6f06e8241b126f2", "0x88dae0fea3f579eedd5f8edd46165ccaef05997d", "0xee7a7dfb9c9179e9dd09eb27594910406006cb8a", "0x0475cad90f0e134969aecd27dfdc8c02b6ec0026"];

			// Act
			const tx = await sut.split(recipients, { from: base, value: 129 });

			// Assert
			const gasConsumption = tx.receipt.gasUsed;
			assert.isAtMost(gasConsumption, desiredGasLimit);
		});
	});

	describe("Withdraw tests", () => {
		const splitAmount = toBN(1);
		const withdrawalAmount = toBN(1);

		it("withdraw Should revert When invoked with zero msg.sender's balance.", async () => {
			// Arrange
			// Act
			const result = sut.withdraw({ from: base });
			// Assert
			await assertRevert(result, "Can not withdraw zero amount.");
		});

		it("withdraw Should set msg sender balance to 0 When passed valid arguments.", async () => {
			// Arrange
			await sut.split([another], { from: base, value: splitAmount });

			// Act
			await sut.withdraw({ from: another });

			// Assert
			const newBalance = await sut.balanceOf(another);

			const expectedBalance = "0";

			assert.equal(expectedBalance, newBalance.toString());
		});

		it("withdraw Should emit Withdrawal event with exact values When passed valid arguments.", async () => {
			// Arrange
			await sut.split([another], { from: base, value: splitAmount });

			// Act
			const { logs } = await sut.withdraw({ from: another });

			// Assert
			await inLogs(logs, "Withdrawal", { "recipient": another, "amount": withdrawalAmount });
		});

		it("withdraw Should transfer exact amount to msg sender When passed valid arguments.", async () => {
			// Arrange
			await sut.split([another], { from: base, value: splitAmount });

			const previousBalance = toBN(await web3.eth.getBalance(another));
			const gasPrice = toBN(await web3.eth.getGasPrice());

			// Act
			const tx = await sut.withdraw({ from: another, gasPrice: gasPrice });

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