pragma solidity 0.5.7;


contract ReceiverStub {
	function () external payable {
		revert();
	}
}