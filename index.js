const line = require("@line/bot-sdk");
const crypto = require("crypto");

exports.handler = async (event, context) => {
  // 署名の検証が必要
  // https://developers.line.biz/ja/docs/messaging-api/receiving-messages/#verifying-signatures
  const hash = crypto
    .createHmac("sha256", process.env.CHANNEL_SECRET)
    .update(event.body)
    .digest("base64");

  const checkLineSignature = (event.headers || {})["x-line-signature"];

  if (checkLineSignature != hash) {
    console.log("invalid signature");
    return;
  }

  const body = JSON.parse(event.body);
  if (body.events[0].type === "message") {
    const client = new line.Client({
      channelAccessToken: process.env.LINE_ACCESS_TOKEN,
    });

    const message = {
      type: "text",
      text: body.events[0].message.text,
    };

    await client
      .replyMessage(body.events[0].replyToken, message)
      .then((response) => {
        let lambdaResponse = {
          statusCode: 200,
          headers: { "X-Line-Status": "OK" },
          body: '{"result":"completed"}',
        };
        context.succeed(lambdaResponse);
      });
  }
};
