import { signalingService, SignalingMessage } from './SignalingService';

export class VoipService {
    private peerConnection: any | null = null;
    private targetId: string | null = null;

    constructor() { }

    async startCall(targetId: string) {
        this.targetId = targetId;
        console.log('VOIP: Starting call to', targetId);

        // In a real implementation we would use react-native-webrtc here.
        // Setting up mock offer...
        const offer = { type: 'offer', sdp: 'MOCK_SDP_OFFER' };

        signalingService.send({
            target: targetId,
            type: 'offer',
            sdp: offer.sdp
        });
    }

    handleSignalingMessage(msg: SignalingMessage) {
        switch (msg.type) {
            case 'offer':
                console.log('VOIP: Received offer, sending answer...');
                signalingService.send({
                    target: msg.sender,
                    type: 'answer',
                    sdp: 'MOCK_SDP_ANSWER'
                });
                break;
            case 'answer':
                console.log('VOIP: Received answer, call established (PQC Secured)');
                break;
            case 'candidate':
                console.log('VOIP: Received ICE candidate');
                break;
        }
    }
}

export const voipService = new VoipService();
