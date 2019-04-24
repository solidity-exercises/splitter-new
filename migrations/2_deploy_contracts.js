const Splitter = artifacts.require('Splitter.sol');

module.exports = function (deployer, ...args) {
	deployer.then(async () => {
		deployer.deploy(Splitter);
	});
};
