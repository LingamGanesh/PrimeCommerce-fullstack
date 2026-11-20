import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import SupportTicketModel from "../models/supportTicket.model.js";

test("support ticket accepts append-only customer and admin message records", async () => {
  const userId = new mongoose.Types.ObjectId();
  const ticket = new SupportTicketModel({
    userId, subject: "Delivery issue", message: "My delivery is delayed",
    messages: [
      { senderRole: "customer", senderId: userId, body: "My delivery is delayed" },
      { senderRole: "admin", senderId: new mongoose.Types.ObjectId(), body: "We are checking this now" }
    ]
  });
  await assert.doesNotReject(ticket.validate());
  assert.equal(ticket.messages.length, 2);
  assert.equal(ticket.messages[0].senderRole, "customer");
  assert.equal(ticket.messages[1].senderRole, "admin");
});

test("support ticket rejects unknown message sender roles and oversized message bodies", async () => {
  const userId = new mongoose.Types.ObjectId();
  const ticket = new SupportTicketModel({
    userId, subject: "Delivery issue", message: "My delivery is delayed",
    messages: [{ senderRole: "superuser", senderId: userId, body: "Invalid sender" }]
  });
  await assert.rejects(ticket.validate());
});