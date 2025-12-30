import React, { useState, useEffect } from "react";
import "./ChatWidget.css";
import { Fade } from "react-reveal";

function ChatWidget(props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const theme = props.theme;

  // Whenever the theme changes OR the widget is opened, we trigger the loader
  useEffect(() => {
    setIsLoading(true);
  }, [theme.name, isOpen]);

  return (
    <div className="chat-widget-wrapper">
      <Fade bottom collapse when={isOpen} duration={500}>
        <div
          className="gradio-container"
          style={{
            backgroundColor: theme.body,
            border: `1px solid ${theme.accentColor}`,
          }}
        >
          {isLoading && (
            <div
              className="loader-container"
              style={{ backgroundColor: "transparent" }}
            >
              <div
                className="spinner"
                style={{ borderTopColor: theme.accentColor }}
              ></div>
              <p
                style={{
                  color: theme.accentColor,
                  marginTop: "10px",
                  fontSize: "14px",
                }}
              >
                Initializing...
              </p>
            </div>
          )}

          {/* IFRAME is much more stable than the <gradio-app> tag */}
          {isOpen && (
            <iframe
              src={`https://sumitga-portfolio.hf.space/?__theme=${theme.name}`}
              width="100%"
              height="100%"
              style={{ border: "none", borderRadius: "15px" }}
              allow="clipboard-write; megaphone"
              sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
              onLoad={() => setIsLoading(false)}
              title="Gradio Chat Assistant"
            ></iframe>
          )}
        </div>
      </Fade>

      <button
        className="chat-bubble"
        onClick={() => setIsOpen(!isOpen)}
        style={{ backgroundColor: theme.accentColor }}
      >
        {isOpen ? "✕" : "💬"}
      </button>
    </div>
  );
}

export default ChatWidget;
