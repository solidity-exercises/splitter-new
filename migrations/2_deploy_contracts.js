const Splitter = artifacts.require('Splitter.sol');

module.exports = function (deployer, ...args) {
	deployer.deploy(Splitter);
};
