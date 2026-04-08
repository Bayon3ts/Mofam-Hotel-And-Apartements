import {
  useVoiceAssistant,
  BarVisualizer,
  VoiceAssistantControlBar,
  useTrackTranscription,
  useLocalParticipant,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { useEffect, useState } from "react";
import { useTracks, VideoTrack } from '@livekit/components-react';
import "./AvatarVoiceAgent.css";

const Message = ({ type, text }) => {
  return <div className="message">
    <strong className={`message-${type}`}>
      {type === "agent" ? "Agent: " : "You: "}
    </strong>
    <span className="message-text">{text}</span>
  </div>;
};

const AvatarVoiceAgent = () => {
  const { state, audioTrack, agentTranscriptions } = useVoiceAssistant();
  const localParticipant = useLocalParticipant();
  const { segments: userTranscriptions } = useTrackTranscription({
    publication: localParticipant.microphoneTrack,
    source: Track.Source.Microphone,
    participant: localParticipant.localParticipant,
  });
  const trackRefs = useTracks([Track.Source.Camera]);
  const localCamTrackRef = trackRefs.find((trackRef) => trackRef.participant.name = 'admin');

  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const allMessages = [
      ...(agentTranscriptions?.map((t) => ({ ...t, type: "agent" })) ?? []),
      ...(userTranscriptions?.map((t) => ({ ...t, type: "user" })) ?? []),
    ].sort((a, b) => a.firstReceivedTime - b.firstReceivedTime);
    setMessages(allMessages);
  }, [agentTranscriptions, userTranscriptions]);

  return (
    <div className="voice-assistant-container">
      <div className="visualizer-container">
        <BarVisualizer state={state} barCount={5} trackRef={audioTrack} />
      </div>
      <>
      {localCamTrackRef ? <VideoTrack trackRef={localCamTrackRef} /> : <div>Calling the Concierce...</div>}
      </>
      <div className="control-section">
        <VoiceAssistantControlBar />
      </div>
    </div>
  );
};

export default AvatarVoiceAgent;
