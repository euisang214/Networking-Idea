const axios = require("axios");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const logger = require("../utils/logger");
if (process.env.MOCK_INTEGRATIONS === "true") {
  module.exports = require("./mocks/zoomService");
  return;
}

class ZoomService {
  constructor() {
    this.apiKey = process.env.ZOOM_API_KEY;
    this.apiSecret = process.env.ZOOM_API_SECRET;
    this.verificationToken = process.env.ZOOM_VERIFICATION_TOKEN;
    this.baseUrl = "https://api.zoom.us/v2";
    this.webhookSecret = process.env.ZOOM_WEBHOOK_SECRET;
  }

  // Get JWT token for API access
  async getZoomToken() {
    const payload = {
      iss: this.apiKey,
      exp: new Date().getTime() + 5000,
    };

    return require("jsonwebtoken").sign(payload, this.apiSecret);
  }

  // Create a Zoom meeting for a session
  async createMeeting(session, professional, user) {
    try {
      const token = await this.getZoomToken();

      const response = await axios({
        method: "post",
        url: `${this.baseUrl}/users/me/meetings`,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        data: {
          topic: `Networking Session: ${professional.user.firstName} ${professional.user.lastName}`,
          type: 2, // Scheduled meeting
          start_time: new Date(session.startTime).toISOString(),
          duration: Math.round(
            (session.endTime - session.startTime) / (1000 * 60),
          ), // Convert to minutes
          timezone: professional.settings?.timezone || "UTC",
          password: this.generateMeetingPassword(),
          agenda: `Networking session between candidate and professional. Session ID: ${session._id}`,
          settings: {
            host_video: true,
            participant_video: true,
            join_before_host: false,
            mute_upon_entry: false,
            watermark: false,
            use_pmi: false,
            approval_type: 0,
            audio: "both",
            auto_recording: "none",
          },
        },
      });

      logger.info(`Created Zoom meeting for session ${session._id}`);

      return {
        meetingId: response.data.id,
        meetingUrl: response.data.join_url,
        password: response.data.password,
        startUrl: response.data.start_url,
      };
    } catch (error) {
      logger.error(`Failed to create Zoom meeting: ${error.message}`);
      throw new Error(`Failed to create Zoom meeting: ${error.message}`);
    }
  }

  // Update an existing Zoom meeting
  async updateMeeting(meetingId, session, professional, user) {
    try {
      const token = await this.getZoomToken();
      await axios({
        method: "patch",
        url: `${this.baseUrl}/meetings/${meetingId}`,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        data: {
          start_time: new Date(session.startTime).toISOString(),
          duration: Math.round(
            (session.endTime - session.startTime) / (1000 * 60),
          ),
          timezone: professional.settings?.timezone || "UTC",
          agenda: `Networking session between candidate and professional. Session ID: ${session._id}`,
        },
      });

      logger.info(
        `Updated Zoom meeting ${meetingId} for session ${session._id}`,
      );
    } catch (error) {
      logger.error(`Failed to update Zoom meeting: ${error.message}`);
      throw new Error(`Failed to update Zoom meeting: ${error.message}`);
    }
  }

  // Verify a Zoom meeting occurred and met minimum requirements
  async verifyMeeting(meetingId) {
    try {
      const token = await this.getZoomToken();

      const response = await axios({
        method: "get",
        url: `${this.baseUrl}/past_meetings/${meetingId}`,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Get participants to verify at least 2 people attended
      const participantsResponse = await axios({
        method: "get",
        url: `${this.baseUrl}/past_meetings/${meetingId}/participants`,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const participants = participantsResponse.data.participants || [];
      const uniqueParticipants = new Set(participants.map((p) => p.user_id));
      const participantCount = uniqueParticipants.size;

      // Check if meeting has ended
      if (response.data.status !== "ended") {
        return {
          verified: false,
          reason: "Meeting has not ended",
          participantCount: participantCount,
        };
      }

      // Check minimum duration (15 minutes)
      const meetingDuration = response.data.duration || 0;
      if (meetingDuration < 15) {
        return {
          verified: false,
          reason: "Meeting duration too short",
          duration: meetingDuration,
          participantCount: participantCount,
        };
      }

      // Check minimum participants (at least 2)
      if (participantCount < 2) {
        return {
          verified: false,
          reason: "Not enough participants",
          participantCount: participantCount,
        };
      }

      return {
        verified: true,
        duration: meetingDuration,
        participantCount: participantCount,
        startTime: response.data.start_time,
        endTime: response.data.end_time,
      };
    } catch (error) {
      logger.error(
        `Failed to verify Zoom meeting ${meetingId}: ${error.message}`,
      );
      throw new Error(`Failed to verify Zoom meeting: ${error.message}`);
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(request) {
    const { verifyZoomSignature } = require("../utils/signatureUtils");
    return verifyZoomSignature(request, this.webhookSecret);
  }

  // Generate a random password for Zoom meetings
  generateMeetingPassword() {
    return Math.random().toString(36).slice(-8);
  }

  // Handle meeting ended event from webhook
  async handleMeetingEnded(payload) {
    try {
      const meetingId = payload.object.id;
      const meetingVerification = await this.verifyMeeting(meetingId);

      logger.info(
        `Zoom meeting ${meetingId} ended, verification result:`,
        meetingVerification,
      );

      return meetingVerification;
    } catch (error) {
      logger.error(`Error handling meeting ended event: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new ZoomService();
