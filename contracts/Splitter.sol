pragma solidity 0.5.7;


contract Splitter {
	uint16 constant RECIPIENTS_MAX_LEN = 1024;

	event Split(address indexed from, uint256 share);

	modifier lengthRestricted(uint256 _len) {
		require(_len <= RECIPIENTS_MAX_LEN, "Passed len greater than recipients max len.");
		_;
	}

	modifier withMoney() {
		require(msg.value > 0, "Zero value split not allowed.");
		_;
	}

	function split(address payable[] calldata recipients) external payable lengthRestricted(recipients.length) withMoney {
		uint256 tip = msg.value % recipients.length;
		uint256 share = msg.value / recipients.length;

		emit Split(msg.sender, share);

		for (uint256 i = 0; i < recipients.length; i++) {
			address payable recipient = recipients[i];
			// Avoid burning
			if (recipient != address(0)) {
				// Avoid DOS by external revert
				bool sent = recipient.send(share);

				// Avoid eth being stuck in contract
				if (!sent) {
					tip += share;
				}
			} else {
				tip += share;
			}
		}

		// Send back the tip
		if (tip > 0) {
			msg.sender.send(tip);
		}
	}
}