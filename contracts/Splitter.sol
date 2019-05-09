pragma solidity 0.5.7;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";


contract Splitter {
	using SafeMath for uint256;

	uint8 constant RECIPIENTS_MAX_LEN = 128;
	mapping (address => uint256) public balanceOf;

	event Split(address indexed from, address[] recipients, uint256 share);
	event Withdrawal(address indexed recipient, uint256 amount);

	modifier lengthRestricted(uint256 _len) {
		require(_len <= RECIPIENTS_MAX_LEN, "Passed len greater than _recipients max len.");
		_;
	}

	modifier withMoney() {
		require(msg.value > 0, "Zero value split not allowed.");
		_;
	}

	function split(address[] calldata _recipients) external payable lengthRestricted(_recipients.length) withMoney {
		uint256 tip = msg.value.mod(_recipients.length);
		uint256 share = msg.value.div(_recipients.length);

		emit Split(msg.sender, _recipients, share);

		for (uint256 i = 0; i < _recipients.length; i++) {
			address recipient = _recipients[i];
			// Avoid burning
			if (recipient != address(0)) {
				uint256 newBalance = balanceOf[recipient].add(share);
				balanceOf[recipient] = newBalance;
			} else {
				tip = tip.add(share);
			}
		}

		if (tip > 0) {
			balanceOf[msg.sender] = balanceOf[msg.sender].add(tip);
		}
	}

	function withdraw() external {
		uint256 amount = balanceOf[msg.sender];
		require(amount > 0, "Can not withdraw zero amount.");

		balanceOf[msg.sender] = 0;

		emit Withdrawal(msg.sender, amount);

		msg.sender.transfer(amount);
	}
}