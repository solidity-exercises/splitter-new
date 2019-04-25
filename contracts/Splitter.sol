pragma solidity 0.5.7;


contract Splitter {
	uint16 constant RECIPIENTS_MAX_LEN = 1024;

	event Split(address indexed from, uint256 share);

	modifier lengthRestricted(uint256 _len) {
		require(_len <= RECIPIENTS_MAX_LEN, "Passed len greater than recipients max len.");
		_;
	}

	modifier nonZero() {
		require(msg.value > 0, "Zero value split not allowed.");
		_;
	}

	function getContractBalance() external view returns (uint256) {
		return address(this).balance;
	}

	function split(address payable[] calldata recipients) external payable lengthRestricted(recipients.length) nonZero {
		uint256 tip = msg.value % recipients.length;
		uint256 share = msg.value / recipients.length;

		emit Split(msg.sender, share);

		for (uint16 i = 0; i < recipients.length; i++) {
			address payable recipient = recipients[i];
			if (recipient != address(0)) {
				recipient.send(share); // Avoid DOS by external revert
			} else {
				tip += share; // Avoid burning/eth being stuck
			}
		}

		// Send back the tip
		if (tip > 0) {
			msg.sender.send(tip);
		}
	}
}