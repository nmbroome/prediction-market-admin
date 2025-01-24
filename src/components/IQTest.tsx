import React, { useState } from "react";
import OpenAI from "openai";

const IQTest = () => {
  const [iqTestUrl, setIqTestUrl] = useState<string>("");
  const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
  });

  const verifyIQ = async () => {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "What is the Full Scale IQ in this image? Limit your answer to just the number" },
              {
                type: "image_url",
                image_url: {
                  "url": iqTestUrl,
                },
              },
            ],
          },
        ],
      });
      console.log(response.choices[0]);
      const newScore = parseInt(response.choices[0].message.content ?? "");
      console.log(newScore);
      if (newScore < 100) {
        console.log("Sorry, you don't qualify for this current batch based on the results")
      } else {
        console.log("Welcome to Prophet!")
      }
    } catch (error) {
      if (error instanceof Error) {
        console.log("Error verifying IQ: " + error.message);
      } else {
        console.log("Unknown error occurred");
      }
    }
}

return (
    <div>
        <div className="">
          <h2>Confirm Signup</h2>
          <p>You need to do a few more things</p>
          <ol>
            <li>
              <label htmlFor="iq-test-checkbox">
                <input type="checkbox" id="iq-test-checkbox" />
                <span>Take this IQ Test</span>
              </label>
              <a href="https://openpsychometrics.org/tests/FSIQ/1.php" target="_blank" rel="noopener noreferrer">
                <span>(opens in a new tab)</span>
              </a>
            </li>
            <li>
              <label htmlFor="screenshot">
                <input type="checkbox" id="screenshot"/>
                <span>Take a Screenshot of your Results.</span>
              </label>
            </li>
            <li>
              <label htmlFor="iq-result-url">
                <input type="checkbox" id="iq-result-url" />
                <span>Upload your results to 
                  <a href="https://postimages.org/" target="_blank" > PostImages </a>
                </span>
              </label>
            </li>
            <li>
              <label htmlFor="copy-link">
                <input type="checkbox" id="copy-link"/>
                <span>Copy the Direct link (NOT the the regular Link)</span>
              </label>
              <img src="direct-link.png" alt="" />
            </li>
            <li>
              <label htmlFor="iq-result-url">
                <input type="checkbox" id="iq-result-url" />
                <span>Paste the Direct Link here</span>
              </label>
              <input 
                type="text" 
                id="iq-test-image-url" 
                placeholder="Enter PostImages URL" 
                value={iqTestUrl} 
                onChange={(e) => setIqTestUrl(e.target.value)}
              />
            </li>
            <li>
              <label htmlFor="iq-test-checkbox">
                <input type="checkbox" id="iq-test-checkbox" />
                <span>Verify your IQ </span>
              </label>
              <button onClick={verifyIQ}>
                Verify
              </button>
            </li>
          </ol>
        </div>
    </div>
  );
};

export default IQTest;