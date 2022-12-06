// SPDX-License-Identifier: MIT
pragma solidity >=0.6.6;
pragma experimental ABIEncoderV2;

import '@chainlink/contracts/src/v0.6/LinkTokenReceiver.sol';
import '@chainlink/contracts/src/v0.6/interfaces/ChainlinkRequestInterface.sol';
import '@chainlink/contracts/src/v0.6/interfaces/LinkTokenInterface.sol';
import '@chainlink/contracts/src/v0.6/vendor/SafeMathChainlink.sol';

/**
 * @title The Chainlink Mock Oracle contract
 * @notice Chainlink smart contract developers can use this to test their contracts
 */
contract MockOracle is ChainlinkRequestInterface, LinkTokenReceiver {
    using SafeMathChainlink for uint256;

    uint _lastPoolId = 0;

    uint256 public constant EXPIRY_TIME = 5 minutes;
    uint256 private constant MINIMUM_CONSUMER_GAS_LIMIT = 400000;

    struct Request {
        address callbackAddr;
        bytes4 callbackFunctionId;
    }

    LinkTokenInterface internal LinkToken;
    mapping(bytes32 => Request) private commitments;

    event OracleRequest(
        bytes32 indexed specId,
        address requester,
        bytes32 requestId,
        uint256 payment,
        address callbackAddr,
        bytes4 callbackFunctionId,
        uint256 cancelExpiration,
        uint256 dataVersion,
        bytes data
    );

    event CancelOracleRequest(bytes32 indexed requestId);

    /**
     * @notice Deploy with the address of the LINK token
     * @dev Sets the LinkToken address for the imported LinkTokenInterface
     * @param _link The address of the LINK token
     */
    constructor(address _link) public {
        LinkToken = LinkTokenInterface(_link); // external but already deployed and unalterable
    }

    /**
     * @notice Creates the Chainlink request
     * @dev Stores the hash of the params as the on-chain commitment for the request.
     * Emits OracleRequest event for the Chainlink node to detect.
     * @param _sender The sender of the request
     * @param _payment The amount of payment given (specified in wei)
     * @param _specId The Job Specification ID
     * @param _callbackAddress The callback address for the response
     * @param _callbackFunctionId The callback function ID for the response
     * @param _nonce The nonce sent by the requester
     * @param _dataVersion The specified data version
     * @param _data The CBOR payload of the request
     */
    function oracleRequest(
        address _sender,
        uint256 _payment,
        bytes32 _specId,
        address _callbackAddress,
        bytes4 _callbackFunctionId,
        uint256 _nonce,
        uint256 _dataVersion,
        bytes calldata _data
    ) external override onlyLINK checkCallbackAddress(_callbackAddress) {
        bytes32 requestId = keccak256(abi.encodePacked(_sender, _nonce));
        require(
            commitments[requestId].callbackAddr == address(0),
            "Must use a unique ID"
        );
        // solhint-disable-next-line not-rely-on-time
        uint256 expiration = now.add(EXPIRY_TIME);

        commitments[requestId] = Request(_callbackAddress, _callbackFunctionId);

        emit OracleRequest(
            _specId,
            _sender,
            requestId,
            _payment,
            _callbackAddress,
            _callbackFunctionId,
            expiration,
            _dataVersion,
            _data
        );

        // Hardcoded mock response
        _lastPoolId = _lastPoolId + 1;
        uint32 poolId = uint32(_lastPoolId);
        uint32[4] memory operatorIds = [uint32(1), uint32(2), uint32(3), uint32(4)];
        bytes[4] memory encryptedShares = [
            abi.encode("0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001586f656e52473751305a376462584e674b684145552b586743434f4e3472613573395a75444b4b783971554675704f7353746931426d6f72494c635a5a42546c724849644f6f457758797371727449364e59743773346e6b334f4d7269714c797a644b386a374a46446948476663736757523675624e61636a65452b395179334b31754647614d64556e6f526f6e764f7a4b4a514268447368656833425a2b77456753364a355438656e4e6664496954787239797859367571332b5141304d72654b4737795956574a642f3762343642476269716b7667702f4972586177596a6f327543544e6a514e5a4b646f617137436d6d3439617054677256386e2f6f4d6a665855696f435a2f2f30334f3254464952674847522b6745324a49714e7845734442414b303454367a502f6735734d4b4d7168724f4b7351343550556b307851654f6175695654547361764f4653326d55755a6c57673d3d0000000000000000"),
            abi.encode("0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000158716376374f6e4e4f493530376f6e316d57766244576a4171592b4e6f5377624547667976366f53305268575375674c34364a4e62717938473762386c5672374674375352653545674c6e4938354b4f57652f76366952525245315377725a7630615a695673656762786b596d334133686e7555747150587968574f475345427652774c73612b5562502f797769636d466a746e79374c43306d4776354f615672786a66306a4737326d564f2f41453768545953666951614768546d3459593865324753305761396a6461304a48726752445868614739753461473432546f673268434a7144356977416e333433717a346e4955534f725a64502b796f6a70674f4469494b554c364c70473955334c326a7a4c4734364448587a577a5054447857755458387761564d787776446b4a455473554b703874614666673971742f6e325052566f45512b61314f636464706954427a675239673d3d0000000000000000"),
            abi.encode("0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000015845744e3651676170587358436664497a62314d41717158426d30565663744f4a383031467467757a597654533644434c48657871336f4d693262436573797a4c4b7270384a6442753853382b70596c465865754d3579416656432b454d6c587a2f537a386b516c375353784934704e4e447364347366567263756a50632b2f592b546d624271334d6f425464727859695751586d387a336134444563425370642b6a446e2b774b4e4a4c765144504a3630416f79687165376171714c53417570694244664443584a2b796765704f38487971676c48762b384d303266373232613652645a6c74324b7077722f6d764d612b31322f2f4c434a4c637a4a353446525039366f684747734350764c6f494f4971515839333859586b5666714c353266474f54576b424c6e564579714746396438547630364a306a6a6131795a577341796d54644e486345773062376c7a4f743777444352413d3d0000000000000000"),
            abi.encode("0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000015864315035465a6e717a696d44556475585643454b4d57434c64706358626b5137526c655466496a5a506a444e4432704143516c642f7a35655a4139684649416c2f31536b614952445372594b526f307a4438364a364e6248646854374a766d476572455545433439304f43486d44762b6459556471445569494a75654832346172472f6e4978444778666853744766474c7a5a465949626b486f4e33686572664647716933305a424e6975714474724c36466e773456433446556c4464345a494376416b4e764648593162613356575530356a2f79466961355a545a4b654e6b5a4143416c734e6c6c532b7952497273486e326e6c43495a46483157615537455576714a423565754c36622b56426c7a6c5a50493147426754705053566a58636746624b41654448722f5a654530514e2b4447616667335438744e6142684c446451316d76796a4d336d4345346b4c554a39304448413d3d0000000000000000")
        ];
        bytes[4] memory sharePublicKeys = [
            abi.encode("0xb854d1aaddcec272b64f508a99c343d42ebc4c603cb03f2ca5d72760b689fd99b94963e2012f260ba655efc8110b6611"),
            abi.encode("0x8ae4adf378c5e1f852f85b9c3dbfec10cf1e15cb1ae5e7587d1a2219a5699e0a4eb8a2420f8e689fdf3da23244ff70aa"),
            abi.encode("0xb988ba768eb9c272f854c8e3083bff05794fb40c760196186245bb06ea2839811734e619385d500ee53579b0703ee967"),
            abi.encode("0xb988ba768eb9c272f854c8e3083bff05794fb40c760196186245bb06ea2839811734e619385d500ee53579b0703ee967")
        ];
        bytes memory validatorPublicKey = abi.encode("0x8c8f35694ed6b59c2f31ed382127b0ad6551b062111d6f26e6c56dd18520515e9fbbb0dbe774045fdddcbf089aaf3042");
        bytes memory depositDataSignature = abi.encode("0x8c8f35694ed6b59c2f31ed382127b0ad6551b062111d6f26e6c56dd18520515e9fbbb0dbe774045fdddcbf089aaf3042");

        /// Imediately fulfill request for mocking purposes
        this.fulfillValidatorInitRequest(requestId, poolId, operatorIds, encryptedShares, sharePublicKeys, validatorPublicKey, depositDataSignature);
    }

    /**
     * @notice Called by the Chainlink node to fulfill requests
     * @dev Given params must hash back to the commitment stored from `oracleRequest`.
     * Will call the callback address' callback function without bubbling up error
     * checking in a `require` so that the node can get paid.
     * @param _requestId The fulfillment request ID that must match the requester's
     * @param _poolId The pool ID
     * @param _operatorIds - The operator IDs
     * @param _encryptedShares - Standard SSV encrypted shares
     * @param _sharePublicKeys - Each share's BLS pubkey
     * @param _validatorPublicKey - Resulting public key corresponding to the shared private key
     * @param _depositDataSignature - Reconstructed signature of DepositMessage according to eth2 spec
     * @return Status if the external call was successful
     */
    function fulfillValidatorInitRequest(bytes32 _requestId, uint32 _poolId, uint32[4] calldata _operatorIds, bytes[4] calldata _encryptedShares, bytes[4] calldata _sharePublicKeys, bytes calldata _validatorPublicKey, bytes calldata _depositDataSignature)
        external
        isValidRequest(_requestId)
        returns (bool)
    {
        Request memory req = commitments[_requestId];
        delete commitments[_requestId];
        require(
            gasleft() >= MINIMUM_CONSUMER_GAS_LIMIT,
            "Must provide consumer enough gas"
        );
        // All updates to the oracle's fulfillment should come before calling the
        // callback(addr+functionId) as it is untrusted.
        // See: https://solidity.readthedocs.io/en/develop/security-considerations.html#use-the-checks-effects-interactions-pattern
        (bool success, ) = req.callbackAddr.call(
            abi.encodeWithSelector(req.callbackFunctionId, _requestId, _poolId, _operatorIds, _encryptedShares, _sharePublicKeys, _validatorPublicKey, _depositDataSignature)
        ); // solhint-disable-line avoid-low-level-calls
        return success;
    }

    /**
     * @notice Allows requesters to cancel requests sent to this oracle contract. Will transfer the LINK
     * sent for the request back to the requester's address.
     * @dev Given params must hash to a commitment stored on the contract in order for the request to be valid
     * Emits CancelOracleRequest event.
     * @param _requestId The request ID
     * @param _payment The amount of payment given (specified in wei)
     * @param _expiration The time of the expiration for the request
     */
    function cancelOracleRequest(
        bytes32 _requestId,
        uint256 _payment,
        bytes4,
        uint256 _expiration
    ) external override {
        require(
            commitments[_requestId].callbackAddr != address(0),
            "Must use a unique ID"
        );
        // solhint-disable-next-line not-rely-on-time
        require(_expiration <= now, "Request is not expired");

        delete commitments[_requestId];
        emit CancelOracleRequest(_requestId);

        assert(LinkToken.transfer(msg.sender, _payment));
    }

    /**
     * @notice Returns the address of the LINK token
     * @dev This is the public implementation for chainlinkTokenAddress, which is
     * an internal method of the ChainlinkClient contract
     */
    function getChainlinkToken() public view override returns (address) {
        return address(LinkToken);
    }

    // MODIFIERS

    /**
     * @dev Reverts if request ID does not exist
     * @param _requestId The given request ID to check in stored `commitments`
     */
    modifier isValidRequest(bytes32 _requestId) {
        require(
            commitments[_requestId].callbackAddr != address(0),
            "Must have a valid requestId"
        );
        _;
    }

    /**
     * @dev Reverts if the callback address is the LINK token
     * @param _to The callback address
     */
    modifier checkCallbackAddress(address _to) {
        require(_to != address(LinkToken), "Cannot callback to LINK");
        _;
    }
}