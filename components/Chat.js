import React, { Component, Fragment } from "react";
import axios from "axios";
import Pusher from "pusher-js";
import ChatMessage from "./ChatMessage";

const SAD_EMOJI = [55357, 56864];
const HAPPY_EMOJI = [55357, 56832];
const NEUTRAL_EMOJI = [55357, 56848];

class Chat extends Component {
  state = { chats: [] };

  /*
  subscribing to a Pusher channel called 'chat-room'
  Then, Im binding to the 'new-message' event on the channel, which is triggered when a new chat message comes in
  */
  // app_id = "1530754"
  // key = "bf188a6ee9a688df99c2"
  // secret = "a8f508fe93a57b22e227"
  // cluster = "ap2"


  componentDidMount() {
    this.pusher = new Pusher("bf188a6ee9a688df99c2", {
      cluster: "ap2",
      encrypted: true
    });

    this.channel = this.pusher.subscribe("chat-room");

    //the new-message event on the channel, which is triggered when a new chat message comes in.
    //populate the chats property by appending the new chat
    this.channel.bind("new-message", ({ chat = null }) => {
      const { chats } = this.state;
      chat && chats.push(chat);
      this.setState({ chats });
    });

    /*
    below Im binding to the 'connected' event on the Pusher client in order 
    to fetch all the chat messages from history by making a POST to /messages request using Axios.
     Afterwards, I populate the state chats property with the chat messages received in the response.
    */

    this.pusher.connection.bind("connected", () => {
      axios.post("https://chat-woad.vercel.app/messages").then(response => {
        const chats = response.data.messages;
        this.setState({ chats });
      });
    });
  }

  componentWillUnmount() {
    this.pusher.disconnect();
  }

  handleKeyUp = evt => {
    const value = evt.target.value;

    if (evt.keyCode === 13 && !evt.shiftKey) {
      const { activeUser: user } = this.props;
      const chat = { user, message: value, timestamp: +new Date() };

      evt.target.value = "";
      axios.post("https://chat-woad.vercel.app/messages/message", chat);
    }
  };

  render() {
    return (
      this.props.activeUser && (
        <Fragment>
          <div
            className="border-bottom border-gray w-100 d-flex align-items-center bg-white"
            style={{ height: 90 }}
          >
            <h2 className="text-dark mb-0 mx-4 px-2">
              {this.props.activeUser}
            </h2>
          </div>

          {/* The meat and potatoes section, 
              Here I look through each object in the cats array and check who the sender is to set positions
              Then, we use the sentiment score to select the correct emoji
          */}
          <div
            className="px-4 pb-4 w-100 d-flex flex-row flex-wrap align-items-start align-content-start position-relative"
            style={{ height: "calc(100% - 180px)", overflowY: "scroll" }}
          >
            {this.state.chats.map((chat, index) => {
              const previous = Math.max(0, index - 1);
              const previousChat = this.state.chats[previous];
              const position =
                chat.user === this.props.activeUser ? "right" : "left";

              const isFirst = previous === index;
              const inSequence = chat.user === previousChat.user;
              const hasDelay =
                Math.ceil(
                  (chat.timestamp - previousChat.timestamp) / (1000 * 60)
                ) > 1;

              const mood =
                chat.sentiment > 0
                  ? HAPPY_EMOJI
                  : chat.sentiment === 0
                  ? NEUTRAL_EMOJI
                  : SAD_EMOJI;

              return (
                <Fragment key={index}>
                  {(isFirst || !inSequence || hasDelay) && (
                    <div
                      className={`d-block w-100 font-weight-bold text-dark mt-4 pb-1 px-1 text-${position}`}
                      style={{ fontSize: "0.9rem" }}
                    >
                      <span className="d-block" style={{ fontSize: "1.6rem" }}>
                        {String.fromCodePoint(...mood)}
                      </span>
                      <span>{chat.user || "Anonymous"}</span>
                    </div>
                  )}
                  <ChatMessage message={chat.message} position={position} />
                </Fragment>
              );
            })}
          </div>
          <div
            className="border-top border-gray w-100 px-4 d-flex align-items-center bg-light"
            style={{ minHeight: 90 }}
          >
            <textarea
              className="form-control px-3 py-2"
              onKeyUp={this.handleKeyUp}
              placeholder="Enter a chat message"
              style={{ resize: "none" }}
            />
          </div>
        </Fragment>
      )
    );
  }
}

export default Chat;
