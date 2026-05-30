import * as functions from "firebase-functions";

// interface SendEmailData {
//   accessToken: string;
//   to: string;
//   subject: string;
//   html: string;
// }

// export const sendTestEmail = functions.https.onCall(
//   async (request) => {

//     console.log("🔥 FUNCTION HIT");

//     const data = request.data as SendEmailData

//     const {
//       accessToken,
//       to,
//       subject,
//       html
//     } = data;

//     const response = await fetch(
//       "https://graph.microsoft.com/v1.0/me/sendMail",
//       {
//         method: "POST",

//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           "Content-Type": "application/json",
//         },

//         body: JSON.stringify({
//           message: {
//             subject,

//             body: {
//               contentType: "HTML",
//               content: html,
//             },

//             toRecipients: [
//               {
//                 emailAddress: {
//                   address: to,
//                 },
//               },
//             ],
//           },

//           saveToSentItems: true,
//         }),
//       }
//     );

//     if (!response.ok) {
//       const text = await response.text();

//       console.log("GRAPH RESPONSE:", text);

//       throw new functions.https.HttpsError(
//         "internal",
//         text
//       );
//     }

//     return {
//       success: true,
//     };
//   }
// );

interface SendEmailData {
  accessToken: string;
  to: string;
  subject: string;
  html: string;
}

export const sendTestEmail = functions.https.onCall(
  async (request) => {

    const data = request.data as SendEmailData;

    const response = await fetch(
      "https://graph.microsoft.com/v1.0/me/sendMail",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${data.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            subject: data.subject,
            body: {
              contentType: "HTML",
              content: data.html,
            },
            toRecipients: [
              {
                emailAddress: {
                  address: data.to,
                },
              },
            ],
          },
          saveToSentItems: true,
        }),
      }
    );

    const text = await response.text();

    console.log({
      status: response.status,
      body: text,
    });

    if (!response.ok) {
      throw new functions.https.HttpsError(
        "internal",
        text
      );
    }

    return {
      success: true,
    };
  }
);