import { useState } from "react";
import { auth } from "@instantdb/react";

export function Auth() {
  const [state, setState] = useState({
    sentEmail: "",
    email: "",
    code: "",
  });
  const { sentEmail, email, code } = state;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <div>
        {!sentEmail ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100vh",
              fontFamily: "Arial, sans-serif",
            }}
          >
            <h2 style={{ color: "#333", marginBottom: "20px" }}>
              Let's log you in!
            </h2>
            <div>
              <input
                style={{
                  padding: "10px",
                  marginBottom: "15px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  width: "300px",
                }}
                placeholder="Enter your email"
                type="email"
                value={email}
                onChange={(e) => setState({ ...state, email: e.target.value })}
              />
            </div>
            <div>
              <button
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
                onClick={() => {
                  if (!email) return;
                  setState({ ...state, sentEmail: email });
                  auth.sendMagicCode({ email }).catch((err: any) => {
                    alert("Uh oh :" + err.body?.message);
                    setState({ ...state, sentEmail: "" });
                  });
                }}
              >
                Send Code
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100vh",
              fontFamily: "Arial, sans-serif",
            }}
          >
            <h2 style={{ color: "#333", marginBottom: "20px" }}>
              Okay we sent you an email! What was the code?
            </h2>
            <div>
              <input
                style={{
                  padding: "10px",
                  marginBottom: "15px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  width: "300px",
                }}
                type="text"
                placeholder="Code plz"
                value={code || ""}
                onChange={(e) => setState({ ...state, code: e.target.value })}
              />
            </div>
            <button
              style={{
                padding: "10px 20px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
              onClick={(e) => {
                auth
                  .verifyMagicCode({ email: sentEmail, code })
                  .catch((err: any) => {
                    alert("Uh oh :" + err.body?.message);
                    setState({ ...state, code: "" });
                  });
              }}
            >
              Verify
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
