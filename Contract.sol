// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MediaAuth {
    struct Media {
        string cid;
        address owner;
        uint256 timestamp;
    }

    mapping(address => bool) public registeredUsers;
    mapping(string => Media) public mediaRecords;

    event UserRegistered(address user);
    event MediaUploaded(address indexed owner, string cid, uint256 timestamp);

    modifier onlyRegistered() {
        require(registeredUsers[msg.sender], "User not registered");
        _;
    }

    function registerUser() public {
        require(!registeredUsers[msg.sender], "Already registered");
        registeredUsers[msg.sender] = true;
        emit UserRegistered(msg.sender);
    }

    function uploadMedia(string memory _cid) public onlyRegistered {
        require(bytes(mediaRecords[_cid].cid).length == 0, "Media already exists");

        mediaRecords[_cid] = Media({
            cid: _cid,
            owner: msg.sender,
            timestamp: block.timestamp
        });

        emit MediaUploaded(msg.sender, _cid, block.timestamp);
    }

    function getMediaOwner(string memory _cid) public view returns (address) {
        return mediaRecords[_cid].owner;
    }
}
