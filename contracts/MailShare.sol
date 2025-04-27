// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MailShare
 * @dev Smart contract for sharing mail through Ethereum L2 networks
 */
contract MailShare {
    // Structure for a mail message
    struct Mail {
        address sender;
        string encryptedContent;
        string encryptedSubject;
        uint256 timestamp;
        string ipfsHash;     // For storing larger content on IPFS
        bool isWeb2Fallback; // Flag to indicate if web2 fallback was used
    }
    
    // Mapping from recipient address to their inbox
    mapping(address => Mail[]) private mailboxes;
    
    // Mapping for user public encryption keys
    mapping(address => string) private publicKeys;
    
    // Events
    event MailSent(address indexed from, address indexed to, uint256 timestamp, string ipfsHash);
    event PublicKeyUpdated(address indexed user, string publicKey);
    
    /**
     * @dev Send mail to a recipient
     * @param _to Recipient address
     * @param _encryptedContent Encrypted content of the mail
     * @param _encryptedSubject Encrypted subject line
     * @param _ipfsHash IPFS hash if content is stored on IPFS
     * @param _isWeb2Fallback Flag if web2 fallback was used
     */
    function sendMail(
        address _to,
        string memory _encryptedContent,
        string memory _encryptedSubject,
        string memory _ipfsHash,
        bool _isWeb2Fallback
    ) external {
        Mail memory newMail = Mail({
            sender: msg.sender,
            encryptedContent: _encryptedContent,
            encryptedSubject: _encryptedSubject,
            timestamp: block.timestamp,
            ipfsHash: _ipfsHash,
            isWeb2Fallback: _isWeb2Fallback
        });
        
        mailboxes[_to].push(newMail);
        
        emit MailSent(msg.sender, _to, block.timestamp, _ipfsHash);
    }
    
    /**
     * @dev Get mail count for caller
     * @return Number of mails in caller's inbox
     */
    function getMailCount() external view returns (uint256) {
        return mailboxes[msg.sender].length;
    }
    
    /**
     * @dev Get mail details at specific index
     * @param _index Index of mail to retrieve
     */
    function getMail(uint256 _index) external view returns (
        address sender,
        string memory encryptedContent,
        string memory encryptedSubject,
        uint256 timestamp,
        string memory ipfsHash,
        bool isWeb2Fallback
    ) {
        require(_index < mailboxes[msg.sender].length, "Index out of bounds");
        
        Mail memory mail = mailboxes[msg.sender][_index];
        
        return (
            mail.sender, 
            mail.encryptedContent, 
            mail.encryptedSubject, 
            mail.timestamp, 
            mail.ipfsHash, 
            mail.isWeb2Fallback
        );
    }
    
    /**
     * @dev Set or update public encryption key
     * @param _publicKey User's public encryption key
     */
    function setPublicKey(string memory _publicKey) external {
        publicKeys[msg.sender] = _publicKey;
        emit PublicKeyUpdated(msg.sender, _publicKey);
    }
    
    /**
     * @dev Get a user's public encryption key
     * @param _user Address of user
     * @return Public key of specified user
     */
    function getPublicKey(address _user) external view returns (string memory) {
        return publicKeys[_user];
    }
    
    /**
     * @dev Delete mail at specific index
     * @param _index Index of mail to delete
     */
    function deleteMail(uint256 _index) external {
        require(_index < mailboxes[msg.sender].length, "Index out of bounds");
        
        // Move the last element to the position to delete
        if (_index < mailboxes[msg.sender].length - 1) {
            mailboxes[msg.sender][_index] = mailboxes[msg.sender][mailboxes[msg.sender].length - 1];
        }
        
        // Remove the last element
        mailboxes[msg.sender].pop();
    }
} 