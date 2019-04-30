pragma solidity 0.5.7;


contract Splitter {
	uint8 constant RECIPIENTS_MAX_LEN = 128;
	mapping (address => uint256) balanceOf;

	event Split(address indexed from, uint256 share);
	event Withdrawal(address indexed recipient, uint256 amount);

	modifier lengthRestricted(uint256 _len) {
		require(_len <= RECIPIENTS_MAX_LEN, "Passed len greater than _recipients max len.");
		_;
	}

	modifier withMoney() {
		require(msg.value > 0, "Zero value split not allowed.");
		_;
	}

	modifier hasEnoughBalance(uint256 _amount) {
		require(balanceOf[msg.sender] >= _amount, "Your balance is insufficient.");
		_;
	}

	function split(address[] calldata _recipients) external payable lengthRestricted(_recipients.length) withMoney {
		uint256 tip = mod(msg.value, _recipients.length);
		uint256 share = div(msg.value, _recipients.length);

		emit Split(msg.sender, share);

		for (uint256 i = 0; i < _recipients.length; i++) {
			address recipient = _recipients[i];
			// Avoid burning
			if (recipient != address(0)) {
				balanceOf[recipient] = add(balanceOf[recipient], share);
			} else {
				tip += share;
			}
		}

		if (tip > 0) {
			balanceOf[msg.sender] = add(balanceOf[msg.sender], tip);
		}
	}

	function withdraw(uint256 _amount) external hasEnoughBalance(_amount) {
		balanceOf[msg.sender] = sub(balanceOf[msg.sender], _amount);

		emit Withdrawal(msg.sender, _amount);

		msg.sender.transfer(_amount);
	}

	/**
	* @dev Adds two unsigned integers, reverts on overflow.
	*/
	function add(uint256 _a, uint256 _b) private pure returns (uint256) {
		uint256 c = _a + _b;
		require(c >= _a, "SafeMath: addition overflow");

		return c;
	}

	/**
	* @dev Subtracts two unsigned integers, reverts on overflow (i.e. if subtrahend is greater than minuend).
	*/
	function sub(uint256 _a, uint256 _b) private pure returns (uint256) {
		require(_b <= _a, "SafeMath: subtraction overflow");
		uint256 c = _a - _b;

		return c;
	}

	/**
     * @dev Integer division of two unsigned integers truncating the quotient, reverts on division by zero.
     */
	function div(uint256 _a, uint256 _b) private pure returns (uint256) {
		// Solidity only automatically asserts when dividing by 0
		require(_b > 0, "SafeMath: division by zero");
		uint256 c = _a / _b;
		// assert(_a == _b * c + _a % _b); // There is no case in which this doesn't hold

		return c;
	}

	/**
     * @dev Divides two unsigned integers and returns the remainder (unsigned integer modulo),
     * reverts when dividing by zero.
     */
	function mod(uint256 _a, uint256 _b) private pure returns (uint256) {
		require(_b != 0, "SafeMath: modulo by zero");
		return _a % _b;
	}
}