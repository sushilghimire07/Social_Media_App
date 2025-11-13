import { Inngest } from "inngest";
import User from "../models/User.js";
import Connection from "../models/Connection.js";
import sendEmail from "../configs/nodeMailer.js";
import Story from "../models/Story.js";
import Message from '../models/Message.js'

// Create a client to send and receive events
export const inngest = new Inngest({ id: "my-app" });

// Sync user creation from Clerk
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } =
      event.data;

    let username = email_addresses[0].email_address.split("@")[0];

    // Check if username exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      username = `${username}${Math.floor(Math.random() * 1000)}`;
    }

    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      full_name: `${first_name} ${last_name}`,
      profile_picture: image_url,
      username,
    };

    await User.create(userData);
  }
);

// Sync user updates from Clerk
const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } =
      event.data;

    const updatedUserData = {
      email: email_addresses[0].email_address,
      full_name: `${first_name} ${last_name}`,
      profile_picture: image_url,
    };

    await User.findByIdAndUpdate(id, updatedUserData);
  }
);

// Sync user deletion from Clerk
const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-from-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    const { id } = event.data;
    await User.findByIdAndDelete(id);
  }
);

// -------------------- Connection Request Reminder --------------------

const sendNewConnectionRequestReminder = inngest.createFunction(
  { id: "send-new-connection-request-reminder" },
  { event: "app/connection-request" },
  async ({ event, step }) => {
    const { connectionId } = event.data;

    // Step 1: Send initial connection request email
    await step.run("send-connection-request-mail", async () => {
      const connection = await Connection.findById(connectionId).populate(
        "from_user_id to_user_id"
      );

      if (!connection) return;

      const subject = "You have a new Connection Request!";
      const body = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Hi ${connection.to_user_id.full_name},</h2>
          <p>You have a new connection request from ${connection.from_user_id.full_name} (${connection.from_user_id.username})</p>
          <p>Click <a href="${process.env.FRONTEND_URL}/connections" style="color: #10b981;">here</a> to accept or reject the request.</p>
          <br/>
          <p>Thanks,<br/>TOPIBAZZ - Stay Connected</p>
        </div>
      `;

      await sendEmail({
        to: connection.to_user_id.email,
        subject,
        body,
      });
    });

    // Step 2: Wait 24 hours and send a reminder if the request is not accepted
    const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await step.sleepUntil("wait-for-24-hours", in24Hours);

    await step.run("send-connection-request-reminder", async () => {
      const connection = await Connection.findById(connectionId).populate(
        "from_user_id to_user_id"
      );

      if (!connection || connection.status === "accepted") {
        return { message: "Connection already accepted or does not exist." };
      }

      const subject = "Reminder: You have a pending Connection Request!";
      const body = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Hi ${connection.to_user_id.full_name},</h2>
          <p>You have a pending connection request from ${connection.from_user_id.full_name} (${connection.from_user_id.username})</p>
          <p>Click <a href="${process.env.FRONTEND_URL}/connections" style="color: #10b981;">here</a> to accept or reject the request.</p>
          <br/>
          <p>Thanks,<br/>TOPIBAZZ - Stay Connected</p>
        </div>
      `;

      await sendEmail({
        to: connection.to_user_id.email,
        subject,
        body,
      });

      return { message: "Reminder sent successfully." };
    });
  }
);

// inngest function to delte story
const deleteStory = inngest.createFunction(
  { id: "story-delete" },
  { event: "app/story.delete" },
  async ({ event, step }) => {
    const { storyId } = event.data;
    const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours later

    await step.sleepUntil("wait-for-24-hours", in24Hours);

    await step.run("delete-story", async () => {
      await Story.findByIdAndDelete(storyId);
      return { message: "Story deleted" };
    });
  }
);

const sendNotificationsOfUnseenMessages = inngest.createFunction(
  { id: "send-unseen-messages-notification" },
  { cron: "TZ=America/New_York 0 9 * * *" }, // Every day at 9 AM New York time
  async ({ step }) => {
    const messages = await Message.find({ seen: false }).populate("to_user_id");
    const unseenCount = {};

    messages.map((message) => {
      unseenCount[message.to_user_id._id] =
        (unseenCount[message.to_user_id._id] || 0) + 1;
    });

    for (const userId in unseenCount) {
      const user = await User.findById(userId);

      const subject = `You have ${unseenCount[userId]} unseen messages`;
      const body = `
        <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 30px;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
            
            <div style="background: #10b981; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 22px;">📩 New Messages Alert</h1>
            </div>

            <div style="padding: 25px;">
              <h2 style="margin-top: 0;">Hi ${user.full_name},</h2>
              <p style="font-size: 16px; color: #333;">
                You have <strong style="color: #10b981;">${unseenCount[userId]}</strong> unseen message${unseenCount[userId] > 1 ? "s" : ""}.
              </p>
              <p style="font-size: 15px; color: #555;">
                Someone just sent you new messages. Don’t miss them!
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/messages"
                  style="background: #10b981; color: white; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-size: 16px;">
                  View Messages
                </a>
              </div>

              <p style="font-size: 14px; color: #777;">
                Thanks,<br />
                <strong>TOPIBAZZ Team</strong><br />
                Stay connected with your friends 🚀
              </p>
            </div>

            <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #888;">
              © ${new Date().getFullYear()} TOPIBAZZ. All rights reserved.
            </div>
          </div>
        </div>
      `;

      await sendEmail({
        to: user.email,
        subject,
        body,
      });
    }

    return { message: "Notification sent." };
  }
);


// Export all functions
export const functions = [
  syncUserCreation,
  syncUserUpdation,
  syncUserDeletion,
  sendNewConnectionRequestReminder,
  deleteStory,
  sendNotificationsOfUnseenMessages
];
