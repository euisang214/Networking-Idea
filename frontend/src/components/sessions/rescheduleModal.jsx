import React, { useState } from "react";
import PropTypes from "prop-types";
import Modal from "../common/Modal";
import Button from "../common/Button";
import SessionsAPI from "../../api/sessions";

const RescheduleModal = ({ isOpen, onClose, session, onRescheduled }) => {
  const [start, setStart] = useState(session.startTime.slice(0, 16));
  const [end, setEnd] = useState(session.endTime.slice(0, 16));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      await SessionsAPI.rescheduleSession(
        session._id,
        new Date(start).toISOString(),
        new Date(end).toISOString(),
      );
      if (onRescheduled) onRescheduled();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reschedule session.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reschedule Session"
      footer={
        <>
          <Button variant="light" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={loading}
            isLoading={loading}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Time
          </label>
          <input
            type="datetime-local"
            className="w-full border border-gray-300 rounded-md p-2"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Time
          </label>
          <input
            type="datetime-local"
            className="w-full border border-gray-300 rounded-md p-2"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
        {error && (
          <div className="p-2 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
};

RescheduleModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  session: PropTypes.object.isRequired,
  onRescheduled: PropTypes.func,
};

export default RescheduleModal;
